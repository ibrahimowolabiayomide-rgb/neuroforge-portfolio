# Neuroforge — Ibrahim Owolabi's Developer Portfolio

A premium, animated, production-grade personal portfolio built with vanilla HTML, CSS, and JavaScript — no framework, no build step. Dark "industrial forge" aesthetic with a full light-mode theme, an animated canvas hero, filterable project showcase, interactive skills panel, and a working contact form.

**Live site:** https://neuroforge-portfolio.vercel.app/
**Author:** Ibrahim Owolabi ([@ibrahimowolabiayomide-rgb](https://github.com/ibrahimowolabiayomide-rgb))

---

## ✨ Features

- Animated canvas particle field in the hero, fully respecting `prefers-reduced-motion`
- Dark / light theme toggle with `localStorage` persistence and OS-preference detection
- Filterable, keyboard-accessible project grid with a detail modal (focus-trapped, `Escape`-to-close)
- Interactive skills panel using the full WAI-ARIA tablist pattern (arrow-key navigation, roving tabindex)
- Auto-advancing testimonial carousel that pauses on hover/focus and supports touch swipe
- Contact form wired to [FormSubmit](https://formsubmit.co/) — no backend required
- WebP images with automatic JPEG fallback via `<picture>`
- WCAG AA color contrast across both themes, skip link, visible focus states throughout
- SEO: structured data (JSON-LD), Open Graph/Twitter cards, `sitemap.xml`, `robots.txt`

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Markup | Semantic HTML5 |
| Styling | Vanilla CSS3 (custom properties, Grid, Flexbox — no preprocessor) |
| Behavior | Vanilla JavaScript (ES6+, no framework) |
| Server | [Express](https://expressjs.com/) (static file serving only) |
| Fonts | Bebas Neue, Space Grotesk, JetBrains Mono (Google Fonts) |

## 📁 Project Structure

```
neuroforge-portfolio/
├── index.html              # All markup — single-page site
├── server.js                # Express static server
├── package.json
├── sitemap.xml
├── robots.txt
├── css/
│   ├── tokens.css           # Design tokens: colors, type, spacing, shadows
│   ├── base.css              # Resets, buttons, layout primitives
│   ├── nav.css
│   ├── hero.css
│   ├── about.css
│   ├── skills.css
│   ├── projects.css
│   └── sections.css         # Experience, certs, achievements, blog, testimonials, contact, footer
├── js/
│   ├── data.js               # Content: projects, skills, icons — no logic
│   └── main.js               # All interactivity
└── assets/img/
    ├── portrait.jpg / .webp
    ├── og-cover.jpg
    └── projects/*.jpg / *.webp
```

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) 18+ and npm

### Install & Run

```bash
npm install
npm start
```

Then open **http://localhost:3000** in your browser.

For development with auto-restart on file changes:

```bash
npm run dev
```

## 🖊️ Customizing Content

Almost all editable content lives in **`js/data.js`** — no HTML editing required for:
- Project cards (`PROJECTS` array) — title, description, tags, images, live/repo links
- Skills (`SKILLS` object) — grouped by category with proficiency percentages

To swap the placeholder project slot for a real project, edit the first entry in `PROJECTS` in `js/data.js` and replace `assets/img/projects/placeholder-project.jpg` with your own screenshot (recommended: 1280×800, optimized JPEG + a matching `.webp`).

## 🌐 Deployment

This is a static Node/Express app — deploy anywhere that runs Node (Render, Railway, Fly.io, a VPS, etc.):

1. Push this repo to GitHub.
2. On your host, set the start command to `npm start` (or `node server.js`).
3. No environment variables are required for the base site. The contact form posts directly to FormSubmit from the browser.

## 📄 License

MIT © Ibrahim Owolabi
