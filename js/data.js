/* ============================================
   NEUROFORGE — CONTENT DATA
   Skills + Projects + Services + Process, separated
   from logic so content can be edited without
   touching main.js
   ============================================ */

const ICONS = {
  react: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none"/><ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/></svg>',
  code: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="8,6 2,12 8,18"/><polyline points="16,6 22,12 16,18"/></svg>',
  layers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="12,2 22,8 12,14 2,8"/><polyline points="2,14 12,20 22,14"/></svg>',
  bolt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="13,2 4,14 11,14 9,22 20,9 13,9"/></svg>',
  server: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="6" rx="1"/><rect x="3" y="14" width="18" height="6" rx="1"/><line x1="7" y1="7" x2="7" y2="7.01"/><line x1="7" y1="17" x2="7" y2="17.01"/></svg>',
  node: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2l8 4.5v11L12 22l-8-4.5v-11z"/><path d="M12 12V2M12 12l8-4.5M12 12l-8-4.5M12 12v10"/></svg>',
  api: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="6" cy="6" r="3"/><circle cx="18" cy="18" r="3"/><path d="M8.5 8.5L15.5 15.5"/></svg>',
  socket: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg>',
  db: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5"/><path d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3"/></svg>',
  table: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/></svg>',
  fire: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2c2 4-3 5-3 9a3 3 0 006 0c0-1-1-2-1-2s2 1 2 4a5 5 0 01-10 0c0-5 4-7 6-11z"/></svg>',
  cloud: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M7 18a4 4 0 01-1-7.87A5.5 5.5 0 0116.9 8H17a4.5 4.5 0 010 9H7z"/></svg>',
  docker: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="11" width="4" height="4"/><rect x="7" y="11" width="4" height="4"/><rect x="12" y="11" width="4" height="4"/><rect x="7" y="6" width="4" height="4"/><path d="M2 15c0 3 4 5 9 5 6 0 10-3 11-7"/></svg>',
  git: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="12" r="2.5"/><path d="M6 8.5v7M8 17.5c3-1 4-3 4-5.5h3.5"/></svg>',
  brain: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 4a3 3 0 00-3 3 3 3 0 00-2 5 3 3 0 002 5 3 3 0 003 3 3 3 0 003-3V7a3 3 0 00-3-3z"/><path d="M15 4a3 3 0 013 3 3 3 0 012 5 3 3 0 01-2 5 3 3 0 01-3 3 3 3 0 01-3-3"/></svg>',
  wand: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8L19 13M17.8 6.2L19 5M12.2 6.2L11 5M3 21l9-9"/></svg>',
};

/* Company founded 2020 — used to compute a genuine, always-accurate
   "years building" figure instead of a hardcoded stat. */
const FOUNDING_YEAR = 2020;

/* ---------- TECHNOLOGY STACK ----------
   Real technologies only, grouped by category. No proficiency
   percentages — those can't be verified and read as inflated. */
const SKILLS = {
  frontend: [
    { name: 'React', icon: ICONS.react },
    { name: 'Next.js', icon: ICONS.layers },
    { name: 'TypeScript / JavaScript', icon: ICONS.code },
    { name: 'GSAP / Three.js', icon: ICONS.bolt },
  ],
  backend: [
    { name: 'Node.js', icon: ICONS.node },
    { name: 'Express', icon: ICONS.server },
    { name: 'REST API Design', icon: ICONS.api },
    { name: 'Next.js API Routes', icon: ICONS.socket },
  ],
  database: [
    { name: 'MongoDB', icon: ICONS.db },
    { name: 'PostgreSQL', icon: ICONS.table },
    { name: 'Supabase', icon: ICONS.fire },
  ],
  platform: [
    { name: 'Git & GitHub', icon: ICONS.git },
    { name: 'Vercel', icon: ICONS.cloud },
    { name: 'Docker', icon: ICONS.docker },
  ],
  integrations: [
    { name: 'Paystack / Stripe', icon: ICONS.wand },
    { name: 'Supabase Auth', icon: ICONS.brain },
    { name: 'LLM API Integration', icon: ICONS.bolt },
  ],
};

/* ---------- SERVICES ---------- */
const SERVICES = [
  {
    title: 'Business & Marketing Websites',
    desc: 'Fast, professional websites for companies and services — built to load quickly, rank well, and represent the business properly online.',
  },
  {
    title: 'Full-Stack Web Applications',
    desc: 'End-to-end applications — a working interface backed by real APIs, databases, and authentication, not just a front-end mockup.',
  },
  {
    title: 'SaaS Platforms & Dashboards',
    desc: 'Multi-user platforms with accounts, roles, and data views — the kind of product a team logs into every day.',
  },
  {
    title: 'E-Commerce & Marketplaces',
    desc: 'Storefronts and marketplace flows — product catalogs, checkout, payments, and seller or vendor onboarding.',
  },
  {
    title: 'Backend & API Systems',
    desc: 'The infrastructure behind a product — databases, authentication, payment integration, and APIs designed to hold up under real use.',
  },
  {
    title: 'AI-Integrated Applications',
    desc: 'Products that use LLM APIs for real functionality — not a chatbot bolted on, but AI used where it genuinely improves the experience.',
  },
];

/* ---------- DEVELOPMENT PROCESS ---------- */
const PROCESS = [
  { num: '01', title: 'Discovery', desc: 'Understand the idea, the requirements, who it\'s for, and what it actually needs to do.' },
  { num: '02', title: 'Planning', desc: 'Define the architecture, feature set, technology choices, and overall direction before writing code.' },
  { num: '03', title: 'Design & Development', desc: 'Build the interface and the functionality together, so the two never drift apart.' },
  { num: '04', title: 'Testing', desc: 'Check usability, responsiveness, and functionality across real devices and screen sizes.' },
  { num: '05', title: 'Deployment', desc: 'Ship the product to production, configured properly rather than just "working on my machine."' },
  { num: '06', title: 'Support & Iteration', desc: 'Stay involved after launch — fixing issues and improving the product as real usage reveals what matters.' },
];

/* ---------- WHY WORK WITH ME ---------- */
const WHY_POINTS = [
  { title: 'Full-Stack Capability', desc: 'One developer who can own the interface, the backend, and the database — instead of coordinating three.' },
  { title: 'End-to-End Delivery', desc: 'From first discovery call to a deployed, production URL — not a handoff halfway through.' },
  { title: 'Real Problem-Solving', desc: 'I care about whether the thing actually works for the people using it, not just whether it compiles.' },
  { title: 'Clean, Maintainable Architecture', desc: 'Code that someone else — or future me — can actually read, extend, and debug.' },
  { title: 'Deployment You Can Rely On', desc: 'Comfortable taking a project from local development to a live, properly configured production environment.' },
  { title: 'Straightforward Communication', desc: 'Clear updates on progress and honest answers about scope, timeline, and tradeoffs.' },
];

/* ---------- PROJECTS ----------
   Real projects only — exactly three, no filler slots.
   status: 'client' | 'development'
   badgeText controls what's shown on the card + modal.
   builtFor / role / capability power the case-study-style card. */
const PROJECTS = [
  {
    id: 'imperial-shelter-tech',
    title: 'Imperial Shelter-Tech Konsult',
    status: 'client',
    badgeText: 'Client Project',
    year: '2026',
    cats: ['client', 'fullstack'],
    builtFor: 'Perimeter security & architectural consultancy',
    role: 'Full-Stack Developer',
    capability: 'Business website with lead-gen & WhatsApp integration',
    short: 'Website for a perimeter security & architectural consultancy in Ibadan, Nigeria.',
    desc: 'A full business website built for Imperial Shelter-Tech Konsult — a perimeter security and architectural consultancy based in Ibadan, Nigeria. The site presents their services (rigid panel mesh fencing, solar-powered electric fencing, perimeter security systems, architectural design & construction, land surveying, and CCTV installation), a project portfolio, and a lead-generation contact flow with WhatsApp integration.',
    problem: 'Imperial Shelter-Tech Konsult had real, completed installation work — but no professional web presence to show it. Prospective clients had no way to see past projects, understand the service range, or get in touch without already having a phone number.',
    decision: 'Rather than build a custom lead-capture form and backend to store it, I wired the quote-request flow directly into WhatsApp with a scannable QR code — the channel their actual customers already use, with no extra infrastructure to maintain.',
    statusNote: 'Live in production, and currently the client\'s primary web presence.',
    features: [
      'Service pages covering all six of the client\'s core offerings',
      'Project portfolio showcasing completed installations and builds',
      'Direct WhatsApp quote-request integration with a scannable QR code',
      'Client testimonials and a founder / company story section',
      'Fully responsive across desktop, tablet, and mobile',
      'Built and deployed on Vercel with Cloudinary-hosted media'
    ],
    tags: ['Next.js', 'Vercel', 'Cloudinary'],
    img: 'https://res.cloudinary.com/dfrqlahmr/image/upload/q_auto/f_auto/v1782048209/IMG-20260621-WA0036_dbbgpi.jpg',
    logo: 'assets/img/projects/imperial-shelter-tech-logo.png',
    demo: 'https://imperial-shelter-tech.vercel.app/',
    repo: '#'
  },
  {
    id: 'veyra',
    title: 'Veyra',
    status: 'development',
    badgeText: 'Under Development',
    year: '2026',
    cats: ['development', 'fullstack', 'ecommerce'],
    builtFor: 'Own product — relationship, lifestyle & marketplace platform',
    role: 'Product Design & Full-Stack Development',
    capability: 'Marketplace, seller onboarding & subscription payments',
    short: 'A relationship, lifestyle, and marketplace platform — buyer/seller accounts, storefronts, and subscriptions.',
    desc: 'Veyra is a full-stack platform that brings relationship-focused experiences, marketplace discovery, and commerce into one product. It combines buyer and seller accounts, a "Become a Seller" onboarding flow, seller dashboards and storefronts, and tiered membership plans, built around the idea of making a complex ecosystem feel simple to navigate.',
    problem: 'The idea was to combine relationship-focused content, lifestyle discovery, and a real marketplace into one coherent product — instead of three separate, half-built ideas competing for attention.',
    decision: 'Chose Supabase over wiring up a separate auth provider plus a standalone ORM — it bundles Postgres, authentication, and row-level security in one place, which matters when you\'re building solo and don\'t have a backend team to lean on.',
    statusNote: 'Active development. The core marketplace, seller onboarding, and Paystack integration are built; still being refined ahead of a public launch.',
    features: [
      'Marketplace with Buy Now purchasing',
      'Buyer and Seller account types with dedicated onboarding',
      'Seller Dashboard for managing storefronts and products',
      'Free, Gold, and Elite seller membership tiers',
      'Paystack payment integration with bank & payout verification',
      'Supabase authentication and account security',
      'Responsive design across mobile and desktop'
    ],
    tags: ['Next.js', 'TypeScript', 'Supabase', 'Paystack'],
    img: null,
    logo: 'assets/img/projects/veyra-logo.jpeg',
    demo: 'https://veyra-umber-sigma.vercel.app/',
    repo: '#'
  },
  {
    id: 'amoura',
    title: 'Amoura',
    status: 'development',
    badgeText: 'Under Development',
    year: '2026',
    cats: ['development', 'frontend'],
    builtFor: 'Own product — private relationship-memory app',
    role: 'Full-Stack Development',
    capability: 'Private, polished consumer app experience',
    short: 'A private, premium love-story app — letters, memories, and music made to be relived.',
    desc: 'Amoura is a private, premium experience for preserving a relationship\'s letters, memories, and music in one place, designed to be revisited over time. It\'s currently in active development.',
    problem: 'The idea was a private, deliberately small space for letters, memories, and music — not another social app competing for attention or engagement time.',
    decision: 'Kept the feature scope intentionally narrow rather than adding capability for its own sake — for something this personal, the restraint is part of the point, not a limitation to fix later.',
    statusNote: 'Active development, early stage.',
    features: [
      'Private, personal space for letters and memories',
      'Music integration as part of the experience',
      'Premium, polished visual design'
    ],
    tags: ['Next.js', 'Vercel'],
    img: null,
    logo: 'assets/img/projects/amoura-logo.png',
    demo: 'https://amoura-w3vb.vercel.app/',
    repo: '#'
  },
];

/* ---------- FIRST-VISIT "CURRENTLY BUILDING" NOTIFICATION ----------
   Data-driven so a finished product can be removed from the notice
   with a one-line edit — no need to touch the notification logic
   in main.js. Set `active: false` (or delete the entry) once a
   product ships. */
const BUILDING_NOW = [
  { name: 'Amoura', active: true },
  { name: 'Veyra', active: true },
];

const ROLES = [
  'Full-Stack Developer',
  'Digital Product Builder',
  'Backend Architect',
  'AI Integration Specialist'
];

/* ---------- HERO ORBIT ----------
   The real, current stack shown as the hero's visual centerpiece —
   matches SKILLS above, not a padded generic list. Icons are original,
   simplified monogram/glyph marks in each technology's associated
   color (not traced reproductions of official logo artwork) — kept
   consistent with the rest of the site's own line-art icon language
   rather than mixing in realistic brand assets. */
const ORBIT_TECH = [
  {
    name: 'Next.js', color: 'var(--text)',
    icon: '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9.5" stroke="currentColor" stroke-width="1.4"/><path d="M9 8v8M9 8l7 8.3M15.2 8v5.6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  },
  {
    name: 'React', color: '#61DAFB',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/><ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/></svg>'
  },
  {
    name: 'TypeScript', color: '#3E8ED0',
    icon: '<svg viewBox="0 0 24 24" fill="none"><text x="12" y="16.5" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11" font-weight="700" fill="currentColor">TS</text></svg>'
  },
  {
    name: 'JavaScript', color: '#E8C547',
    icon: '<svg viewBox="0 0 24 24" fill="none"><text x="12" y="16.5" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11" font-weight="700" fill="currentColor">JS</text></svg>'
  },
  {
    name: 'Node.js', color: '#5FA96A',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"><path d="M12 2.5l8 4.6v9.8l-8 4.6-8-4.6V7.1z"/></svg>'
  },
  {
    name: 'Python', color: '#4B8BBE',
    icon: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 3c-3.5 0-4.4 1.2-4.4 2.7v2h4.6v.9H6.2C4.4 8.6 3 9.7 3 12s1.4 3.4 3.2 3.4h1.5v-2.2c0-2 1.7-3.4 3.5-3.4h4.1c1.6 0 2.9-1.3 2.9-2.9V5.7C18.2 4.2 16.5 3 12 3z" fill="#4B8BBE"/><path d="M12 21c3.5 0 4.4-1.2 4.4-2.7v-2h-4.6v-.9h6c1.8 0 3.2-1.1 3.2-3.4s-1.4-3.4-3.2-3.4h-1.5v2.2c0 2-1.7 3.4-3.5 3.4H8.7c-1.6 0-2.9 1.3-2.9 2.9v2.6C5.8 19.8 7.5 21 12 21z" fill="#F4D03F"/></svg>'
  },
  {
    name: 'PostgreSQL', color: '#5C8FC9',
    icon: '<svg viewBox="0 0 24 24" fill="none"><text x="12" y="16" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9.5" font-weight="700" fill="currentColor">Pg</text></svg>'
  },
  {
    name: 'Supabase', color: '#3ECF8E',
    icon: '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="13,2 4,14 11,14 9,22 20,9 13,9"/></svg>'
  },
];
