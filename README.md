# Innova2026

Plataforma de monitoreo satelital de suelos y cobertura vegetal en tiempo real.

## Project layout

```
.
├── front/             Astro 7 frontend (Tailwind v4, Material 3)
│   ├── src/
│   │   ├── components/
│   │   │   ├── landing/   (Hero, NavBar, MetricsGrid, LulcDynamics, ...)
│   │   │   └── ui/        (Button, Badge, MetricCard, AlertItem, IndexCard, Icon)
│   │   ├── layouts/Layout.astro
│   │   ├── pages/index.astro
│   │   ├── styles/global.css      Tailwind @theme con tokens Material 3
│   │   ├── types/landing.ts       Interfaces TS
│   │   ├── constants/assets.ts    URLs externas
│   │   └── data/landing.ts        Contenido de cada sección
│   ├── public/                    Favicons
│   ├── astro.config.mjs
│   ├── package.json
│   └── tsconfig.json
└── back/              Node.js + Express backend
    ├── src/
    │   ├── controllers/
    │   ├── middlewares/
    │   ├── models/
    │   ├── routes/
    │   └── services/    (incluye integraciones externas: sentinel, firms, forest-watch, ...)
    └── package.json
```

## Frontend (front/)

```sh
cd front
npm install
npm run dev          # localhost:4321
npm run build
npm run check        # astro check (type check)
```

## Backend (back/)

```sh
cd back
npm install
npm run dev
```

Ver [`back/README.md`](back/README.md) para más detalle del backend.
