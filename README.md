# Neuroforge portfolio

A static portfolio site with a real contact form. Plain HTML, CSS and a few small scripts. No framework, no build step and no analytics.

Live: https://neuroforge-portfolio.vercel.app/

## Structure

```
public/                    everything served to visitors (Vercel output directory)
  index.html               home: hero, selected work, capabilities, approach, about, contact
  work/<slug>/index.html   one case study per project (veyra, amoura, imperial-shelter-tech)
  404.html
  css/base.css             fonts, colour tokens, reset, typography, layout
  css/components.css       header, buttons, form, footer
  css/sections.css         home page sections
  css/case.css             case study pages
  css/motion.css           the whole animation system (see docs/rebuild-notes.md)
  js/theme-init.js         applies the saved or system theme before first paint, gates animation
  js/motion.js             decides when things animate (reveals, step marker, pointer depth)
  js/nav.js                mobile menu and the current-section marker
  js/site.js               theme toggle and the contact form
  assets/fonts, assets/img self-hosted fonts (with licences) and optimised images
api/contact.js             Vercel serverless function for the contact form
lib/contact.js             the form logic: validation, abuse controls, Resend call
server.js                  local development server (not deployed)
test/contact.test.js       tests for the contact logic
test/site.test.js          static checks over public/: links, copy rules, CSP safety, motion safety
docs/                      rebuild notes, evidence ledger, content removed in the rebuild
```

The pages are plain HTML files. The header and footer are repeated in each one, so a change to the navigation has to be made in all five pages.

## Run locally

```
npm install
cp .env.example .env      # then add your Resend key
npm start                 # http://localhost:3000
npm test                  # contact logic and static site checks
```

Without `RESEND_API_KEY` the site works, and the contact form answers with an honest "unavailable" message.

## Contact form setup (Resend)

The form posts to `/api/contact`, which sends the message with the Resend API. The visitor sees success only when Resend accepts the message.

1. Create a Resend account and an API key (https://resend.com/api-keys).
2. For delivery to your own inbox while testing, the default sender `onboarding@resend.dev` works only if the recipient is the email address of your Resend account.
3. For production, verify your sending domain in Resend (add the DNS records it shows), then set `CONTACT_FROM_EMAIL` to an address on that domain.
4. In Vercel, add these environment variables to the project, then redeploy:

| Variable | Required | Purpose |
|---|---|---|
| `RESEND_API_KEY` | yes | Resend API key. Never commit it. |
| `CONTACT_TO_EMAIL` | no | Where messages go. Defaults to the address in `lib/contact.js`. |
| `CONTACT_FROM_EMAIL` | no | Sender, for example `Neuroforge <contact@yourdomain.com>`. |
| `SITE_ORIGIN` | no | The site's public origin. Used for the same-origin check. |

Protections: same-origin check, hidden honeypot field, minimum fill time, per-address and per-email rate limits, duplicate-submission protection with an idempotency key, header-injection stripping, and logs that never contain the message or the visitor's email. The rate limiter lives in memory, so on serverless hosting it is best effort. Add a shared store such as Upstash Redis if you need strict limits.

## Deploy

Push to the connected GitHub repository. Vercel serves `public/` and deploys `api/contact.js`. Security headers (including a Content Security Policy with no inline script or style) and caching are defined in `vercel.json`.

## Animation and accessibility

Motion is progressive. Hidden starting states only exist while `<html class="anim">` is set, which `theme-init.js` does only for visitors who allow motion, and removes after four seconds if `motion.js` never started. With JavaScript off, with reduced motion, or if a script fails, every section is simply visible. Scrolling is never intercepted. Scroll-linked effects (progress bar, hero drift, step connector) use CSS scroll and view timelines and are an enhancement for browsers that support them.
