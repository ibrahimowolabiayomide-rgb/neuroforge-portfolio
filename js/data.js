/* ============================================
   NEUROFORGE — CONTENT DATA
   Skills + Projects, separated from logic so
   content can be edited without touching main.js
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

const SKILLS = {
  frontend: [
    { name: 'React', pct: 95, icon: ICONS.react },
    { name: 'Next.js', pct: 92, icon: ICONS.layers },
    { name: 'JavaScript / TypeScript', pct: 94, icon: ICONS.code },
    { name: 'GSAP / Three.js / WebGL', pct: 88, icon: ICONS.bolt },
  ],
  backend: [
    { name: 'Node.js', pct: 93, icon: ICONS.node },
    { name: 'Express', pct: 90, icon: ICONS.server },
    { name: 'REST API Design', pct: 91, icon: ICONS.api },
    { name: 'Socket.io / WebRTC', pct: 85, icon: ICONS.socket },
  ],
  database: [
    { name: 'MongoDB', pct: 90, icon: ICONS.db },
    { name: 'PostgreSQL', pct: 84, icon: ICONS.table },
    { name: 'Firebase', pct: 82, icon: ICONS.fire },
  ],
  devops: [
    { name: 'Git & GitHub', pct: 92, icon: ICONS.git },
    { name: 'Docker', pct: 74, icon: ICONS.docker },
    { name: 'Render / Vercel / Railway', pct: 88, icon: ICONS.cloud },
  ],
  ai: [
    { name: 'LLM API Integration', pct: 86, icon: ICONS.brain },
    { name: 'Prompt Engineering', pct: 89, icon: ICONS.wand },
    { name: 'AI Image / Generative Tools', pct: 80, icon: ICONS.bolt },
  ],
};

const PROJECTS = [
  {
    id: 'next-build',
    title: 'Your Next Build',
    year: '—',
    cats: ['fullstack'],
    live: false,
    placeholder: true,
    short: 'Reserved slot for the next shipped project — swap this card out first.',
    desc: 'This card is a clearly-marked placeholder, not a real shipped project. Replace it with your next case study — problem, build, and outcome — as soon as it\'s ready to show.',
    features: [
      'Swap this copy for a real problem statement and outcome',
      'Add 3–6 concrete features or technical highlights',
      'Link a live demo and/or public repo when available'
    ],
    tags: ['Add', 'Your', 'Stack'],
    img: 'assets/img/projects/placeholder-project.jpg',
    demo: '#',
    repo: '#'
  },
  {
    id: 'veyra',
    title: 'Veyra',
    year: '2025',
    cats: ['fullstack', 'ai', 'ecommerce'],
    live: true,
    short: 'Nigeria\'s AI-powered fashion discovery & marketplace app.',
    desc: 'A social-meets-marketplace fashion app for Nigeria — a TikTok-style discovery feed for fashion, shoes, bags, streetwear, luxury, and native wear, combined with in-app chat, profiles, and a content creation flow for sellers.',
    features: [
      'Algorithmic "For You" / "Following" discovery feed across fashion categories',
      'Category browsing — Fashion, Shoes, Bags, Streetwear, Luxury, Native Wear, Accessories',
      'In-app messaging between buyers and sellers',
      'Creator-style upload flow for listing new items',
      'Notifications and personal profile system',
      'Mobile-first PWA experience tuned for the Nigerian market'
    ],
    tags: ['React', 'Node.js', 'MongoDB', 'AI', 'PWA'],
    img: 'assets/img/projects/veyra.jpg',
    demo: 'https://veyra-umber-sigma.vercel.app',
    repo: '#'
  },
  {
    id: 'neuroforge-os',
    title: 'Neuroforge OS',
    year: '2024',
    cats: ['frontend'],
    live: false,
    short: 'An experimental WebGL-driven personal operating-system concept.',
    desc: 'An experimental concept site exploring how far a browser-based "desktop" interface can go — draggable windows, a WebGL particle background, and a custom window manager built in vanilla JS.',
    features: [
      'Custom window manager with drag, resize, and z-index stacking',
      'WebGL particle field reacting to cursor movement',
      'Keyboard shortcuts for power-user navigation'
    ],
    tags: ['React', 'Node.js', 'WebGL'],
    img: 'assets/img/projects/neuroforge-os.jpg',
    demo: '#',
    repo: '#'
  },
  {
    id: 'quantix',
    title: 'Quantix Dashboard',
    year: '2024',
    cats: ['fullstack'],
    live: false,
    short: 'A metrics dashboard SaaS with animated data storytelling.',
    desc: 'A B2B analytics dashboard that turns raw event data into an animated, scroll-driven story — built for a startup that needed their metrics to look as sharp as their product.',
    features: [
      'GSAP-driven animated chart reveals',
      'Real-time data refresh via polling and websockets',
      'Role-based access control for team accounts'
    ],
    tags: ['Next.js', 'MongoDB', 'GSAP'],
    img: 'assets/img/projects/quantix.jpg',
    demo: '#',
    repo: '#'
  },
  {
    id: 'void-commerce',
    title: 'Void Commerce',
    year: '2023',
    cats: ['ecommerce'],
    live: false,
    short: 'A dark-themed streetwear storefront with Stripe checkout.',
    desc: 'A full e-commerce storefront for a streetwear brand — product catalog, cart, Stripe checkout, and an admin panel for managing inventory and orders.',
    features: [
      'Stripe-powered checkout with webhook order confirmation',
      'Admin panel for inventory and order management',
      'Animated product gallery with size and color variants'
    ],
    tags: ['React', 'Stripe', 'Node.js'],
    img: 'assets/img/projects/void-commerce.jpg',
    demo: '#',
    repo: '#'
  },
  {
    id: 'pulse-analytics',
    title: 'Pulse Analytics',
    year: '2023',
    cats: ['ai', 'frontend'],
    live: false,
    short: 'D3.js data-visualization tool for marketing teams.',
    desc: 'A self-serve data visualization tool letting marketing teams build custom charts from CSV uploads without needing a data analyst on every request.',
    features: [
      'Drag-and-drop CSV-to-chart pipeline',
      'D3.js custom chart rendering with export to PNG/SVG',
      'Shareable read-only dashboard links'
    ],
    tags: ['D3.js', 'Express', 'PostgreSQL'],
    img: 'assets/img/projects/pulse-analytics.jpg',
    demo: '#',
    repo: '#'
  },
  {
    id: 'ether-landing',
    title: 'Ether Landing',
    year: '2023',
    cats: ['frontend'],
    live: false,
    short: 'A cinematic Three.js marketing site for a Web3 product.',
    desc: 'A single-page marketing site for a Web3 startup, built around a Three.js hero scene and scroll-triggered GSAP sequences designed to feel cinematic without sacrificing load time.',
    features: [
      'Custom Three.js 3D hero scene, optimized to under 2MB',
      'GSAP ScrollTrigger-based scene transitions',
      'Lighthouse performance score of 96+'
    ],
    tags: ['Three.js', 'GSAP', 'HTML/CSS'],
    img: 'assets/img/projects/ether-landing.jpg',
    demo: '#',
    repo: '#'
  },
];

const ROLES = [
  'Full-Stack Developer',
  'UI / Motion Engineer',
  'Backend Architect',
  'AI Integration Specialist',
  'Digital Craftsman'
];
