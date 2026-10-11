# Phase 3 rebuild notes

## Why Phase 3

The Phase 2 rebuild fixed the defects (contact form, mobile menu, contrast, keyboard access, sitemap, image weight) but was too restrained: short, plain, one accent and almost no motion. Phase 3 keeps every working part and replaces the visual identity and the page composition. The Express and static architecture, the contact API and its tests are unchanged apart from the points below.

## Visual identity

- Stage and paper. The header, hero, project chapters, contact and footer are always dark ("stages"). The sections between them follow the visitor's theme: warm paper by day, deep ink by night. A `.stage` class redefines the colour tokens, so components never need theme-specific rules.
- Ember (`#ff6b3a`) is the brand colour, teal marks technical signal, gold marks work in progress. Each project has its own hue: Veyra violet, Amoura rose, Imperial blue. Text colours use darker or lighter variants per theme so contrast holds.
- Type: Bricolage Grotesque for display, Instrument Sans for text, Instrument Serif italic for the emphasised word in headings, JetBrains Mono for facts and labels. All self-hosted variable fonts with their OFL licences beside them, preloaded, with metric-adjusted fallbacks.
- Composition: each project chapter is built differently. Veyra is text beside a stack of layers, Amoura is centred and editorial with fanned paper sheets, Imperial puts a drawn site plan beside a service list. The case studies reuse each project's palette and visual.
- Project visuals are illustrations drawn for this site and are labelled as such. They are not screenshots and do not show real product screens.

## Animation system

One language of timings and easing, defined as tokens in `base.css` and used in `motion.css`.

| Technique | Where | Notes |
|---|---|---|
| Word masks that rise | Hero and section headings | Hero words are in the HTML. Other headings are split by `motion.js`. |
| Draw-on stroke | Hero glyph, site plan | SVG `pathLength="1"` with `stroke-dashoffset` |
| Staggered rise | Lists, statements | Delay from an index custom property |
| Layer slide, sheet drop | Veyra layers, Amoura sheets | Individual `translate`, so hover `transform` never fights it |
| Wipe | Portrait | Clip on a child so the observed element keeps its box |
| Step marker | Approach list | IntersectionObserver toggles a class |
| Scroll progress, hero drift, step connector | Whole page | CSS scroll and view timelines inside `@supports` |
| Pointer depth | Hero glyph | Fine pointers only, one rAF per move |
| Page fade | Between pages | `@view-transition` |

Rules the system keeps: transforms and opacity only, no scroll listeners that change position, no smooth-scroll, no wheel handlers, no scroll locking, animation off for reduced motion, content visible without JavaScript.

## Contact form

Unchanged from Phase 2 apart from the fallback page that `lib/contact.js` returns to non-JavaScript submissions, which now uses the new stylesheets, and the provider timeout, which is 8 seconds so it fits Vercel's default 10 second function limit. Success is shown only when the server returns `{ "ok": true }`, which means Resend accepted the message. Real delivery has not been tested in the build environment because no API key or verified sender was available.

## Known limits

- Scroll-linked effects use CSS scroll timelines, which Chromium and Safari support. Other browsers get the same layout without those effects.
- The rate limiter is in memory, so on serverless hosting it is best effort.
- The header and footer are repeated in each HTML file.

# Phase 4: brand and motion

## Brand

Neuroforge is the only brand: header, hero, footer, page titles, metadata, structured data and the social image. No personal name appears anywhere in the public copy, and the location was removed from every branding position with nothing in its place: no new city and no remote-work claim. The About section was written out in full from facts already on the site. See `brand-notes.md`.

## New motion

| Technique | Where | Notes |
|---|---|---|
| Scroll-scrubbed word brightening | Introduction and case "problem" statements | CSS view timeline on each word mask. The mask is the subject because an element with overflow hidden is its own scroll container. |
| Drifting chapter light and title | Home chapters | View timelines. `.chapter` uses `overflow: clip` so they can run. |
| Signal pulse and station pings | Hero pipeline | Runs only while `.is-live` |
| Current and camera sweep | Site plan | Marching dashes on the electric line, rotating cone |
| Staggered mark pop | Capability matrix | Row and column delay |
| Pointer glow, eased depth | Hero | One rAF loop that stops when settled |
| Magnetic buttons, card spotlight, tilt | Buttons, Veyra layers, flow cards, Veyra and Amoura visuals | Fine pointers only. Targets are set in JS, easing is CSS. |
| Spreading theme change | Theme switch | Same-document view transition, circle from the button, skipped for reduced motion |
| Held header between pages | All pages | `view-transition-name` on the header |
| Menu stagger, field nudge, button shimmer, drawn success mark | Navigation and form | |

Rules kept: transforms, opacity and individual transform properties only, no wheel or touch listeners, no smooth-scroll, content visible without JavaScript, nothing animates in reduced motion, nothing loops off screen.

