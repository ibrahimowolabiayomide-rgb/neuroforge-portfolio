# Neuroforge â€” Ibrahim Owolabi's Developer Portfolio

A premium, animated, production-grade personal portfolio built with vanilla HTML, CSS, and JavaScript â€” no framework, no build step. Dark "industrial forge" aesthetic with a full light-mode theme, an animated canvas hero, filterable project showcase, interactive skills panel, and a working contact form.

**Live site:** https://neuroforge-portfolio.vercel.app/
**Author:** Ibrahim Owolabi ([@ibrahimowolabiayomide-rgb](https://github.com/ibrahimowolabiayomide-rgb))

---

## âœ¨ Features

- Animated canvas particle field in the hero, fully respecting `prefers-reduced-motion`
- Dark / light theme toggle with `localStorage` persistence and OS-preference detection
- Filterable, keyboard-accessible project grid with a detail modal (focus-trapped, `Escape`-to-close)
- Interactive skills panel using the full WAI-ARIA tablist pattern (arrow-key navigation, roving tabindex)
- Auto-advancing testimonial carousel that pauses on hover/focus and supports touch swipe
- Contact form wired to [FormSubmit](https://formsubmit.co/) â€” no backend required
- WebP images with automatic JPEG fallback via `<picture>`
- WCAG AA color contrast across both themes, skip link, visible focus states throughout
- SEO: structured data (JSON-LD), Open Graph/Twitter cards, `sitemap.xml`, `robots.txt`

## ðŸ§± Tech Stack

| Layer | Technology |
|---|---|
| Markup | Semantic HTML5 |
| Styling | Vanilla CSS3 (custom properties, Grid, Flexbox â€” no preprocessor) |
| Behavior | Vanilla JavaScript (ES6+, no framework) |
| Server | [Express](https://expressjs.com/) (static file serving only) |
| Fonts | Bebas Neue, Space Grotesk, JetBrains Mono (Google Fonts) |

## ðŸ“ Project Structure

```
neuroforge-portfolio/
â”œâ”€â”€ index.html              # All markup â€” single-page site
â”œâ”€â”€ server.js                # Express static server
â”œâ”€â”€ package.json
â”œâ”€â”€ sitemap.xml
â”œâ”€â”€ robots.txt
â”œâ”€â”€ css/
â”‚   â”œâ”€â”€ tokens.css           # Design tokens: colors, type, spacing, shadows
â”‚   â”œâ”€â”€ base.css              # Resets, buttons, layout primitives
â”‚   â”œâ”€â”€ nav.css
â”‚   â”œâ”€â”€ hero.css
â”‚   â”œâ”€â”€ about.css
â”‚   â”œâ”€â”€ skills.css
â”‚   â”œâ”€â”€ projects.css
â”‚   â””â”€â”€ sections.css         # Experience, certs, achievements, blog, testimonials, contact, footer
â”œâ”€â”€ js/
â”‚   â”œâ”€â”€ data.js               # Content: projects, skills, icons â€” no logic
â”‚   â””â”€â”€ main.js               # All interactivity
â””â”€â”€ assets/img/
    â”œâ”€â”€ portrait.jpg / .webp
    â”œâ”€â”€ og-cover.jpg
    â””â”€â”€ projects/*.jpg / *.webp
```

## ðŸš€ Getting Started

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

## ðŸ–Šï¸ Customizing Content

Almost all editable content lives in **`js/data.js`** â€” no HTML editing required for:
- Project cards (`PROJECTS` array) â€” title, description, tags, images, live/repo links
- Skills (`SKILLS` object) â€” grouped by category with proficiency percentages

To swap the placeholder project slot for a real project, edit the first entry in `PROJECTS` in `js/data.js` and replace `assets/img/projects/placeholder-project.jpg` with your own screenshot (recommended: 1280Ã—800, optimized JPEG + a matching `.webp`).

## ðŸŒ Deployment

This is a static Node/Express app â€” deploy anywhere that runs Node (Render, Railway, Fly.io, a VPS, etc.):

1. Push this repo to GitHub.
2. On your host, set the start command to `npm start` (or `node server.js`).
3. No environment variables are required for the base site. The contact form posts directly to FormSubmit from the browser.

## ðŸ“„ License

MIT Â© Ibrahim Owolabi
