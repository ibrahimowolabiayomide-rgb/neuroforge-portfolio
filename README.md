# Neuroforge — Ibrahim Owolabi's Developer Portfolio (V2)

A professional, technology-platform-style personal portfolio built with vanilla HTML, CSS, and JavaScript — no framework, no build step. Deep-navy / electric-blue visual identity, real projects only (no placeholder or fictional work), and a data-driven content layer.

**Live site:** https://neuroforge-portfolio.vercel.app/
**Author:** Ibrahim Owolabi ([@ibrahimowolabiayomide-rgb](https://github.com/ibrahimowolabiayomide-rgb))

---

## ✨ Features

- Blue technology-platform visual identity — no particle canvas, a calm dot-grid field and a soft cursor-follow glow instead
- Dark / light theme toggle with `localStorage` persistence and OS-preference detection
- Real project showcase only: client work and in-development products, each clearly status-labelled (`Client Project` / `Under Development`) — filterable, keyboard-accessible grid with a detail modal (focus-trapped, `Escape`-to-close)
- First-visit "Currently Building" notice, localStorage-gated (shows once), dismissible, driven entirely by data so a shipped product can be removed from the notice with a one-line edit
- Interactive technology-stack panel using the full WAI-ARIA tablist pattern (arrow-key navigation, roving tabindex) — no invented proficiency percentages
- Contact form wired to [FormSubmit](https://formsubmit.co/) — no backend required
- WCAG AA color contrast across both themes, skip link, visible focus states throughout, `prefers-reduced-motion` respected everywhere
- SEO: structured data (JSON-LD), Open Graph/Twitter cards, `sitemap.xml`, `robots.txt`, all pointing at the live Vercel URL

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Markup | Semantic HTML5 |
| Styling | Vanilla CSS3 (custom properties, Grid, Flexbox — no preprocessor) |
| Behavior | Vanilla JavaScript (ES6+, no framework) |
| Server (local dev) | [Express](https://expressjs.com/) (static file serving only) |
| Hosting | [Vercel](https://vercel.com/) (static site — see `vercel.json`) |
| Fonts | Manrope, Inter, JetBrains Mono (Google Fonts) |

## 📁 Project Structure

```
neuroforge-portfolio/
├── index.html               # All markup — single-page site
├── server.js                 # Express static server (local dev only)
├── vercel.json                # Forces pure static-site serving on Vercel
├── package.json
├── sitemap.xml
├── robots.txt
├── css/
│   ├── tokens.css            # Design tokens: colors, type, spacing, shadows
│   ├── base.css               # Resets, buttons, layout primitives
│   ├── nav.css
│   ├── hero.css
│   ├── about.css
│   ├── services.css
│   ├── stack.css              # Technology stack chip grid
│   ├── projects.css
│   ├── process.css
│   ├── sections.css           # Timeline, certs, why-work-with-me, contact, footer
│   └── notification.css       # First-visit "Currently Building" notice
├── js/
│   ├── data.js                 # Content: projects, skills, services, process — no logic
│   └── main.js                 # All interactivity
└── assets/img/
    ├── portrait.jpg / .webp
    ├── og-cover.jpg
    └── projects/                # Veyra + Amoura logos; Imperial Shelter Tech uses its own live Cloudinary URLs
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
- Project cards (`PROJECTS` array) — title, description, tags, images/logos, live links, status (`client` / `development`)
- Technology stack (`SKILLS` object) — grouped by category
- Services (`SERVICES`), development process (`PROCESS`), and "why work with me" points (`WHY_POINTS`)
- The first-visit build notice (`BUILDING_NOW` array) — set a product's `active` flag to `false` once it ships

## 🌐 Deployment

Deployed as a static site on Vercel. `vercel.json` forces `framework: null` because Vercel otherwise misdetects this as an Express server project and tries to run a build. For local development, `server.js` provides a minimal Express static server.

## 📄 License

MIT © Ibrahim Owolabi
