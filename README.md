# Worship Brasa

## Overview

Worship Brasa is a web application for ministry management, built with a React frontend (Vite) and an AdonisJS backend. The UI closely follows the design system of **LouveApp**, featuring a clean, modern look with dark mode support, glass‑morphism cards, and subtle micro‑animations.

---

## Running the Application

### Prerequisites
- **Node.js** version **24+** (or latest LTS)
- **Docker** and **docker‑compose** installed
- **Git** (optional, for cloning the repository)

### Quick Start on a New Machine
1. Clone the repository (if you haven't already):
   ```bash
   git clone https://github.com/your-org/worship-brasa.git
   cd worship-brasa
   ```
2. Install Node dependencies for both the API and the web client:
   ```bash
   npm install               # root dependencies (scripts, linting)
   cd api && npm install && cd ..
   cd web && npm install && cd ..
   ```
3. Prepare environment files:
   ```bash
   cp api/.env.example api/.env
   cp web/.env.example web/.env
   ```
   - Generate an **APP_KEY** for AdonisJS:
     ```bash
     cd api && node ace generate:key && cd ..
     ```
4. Launch the PostgreSQL container and the API server using Docker Compose:
   ```bash
   docker compose up -d
   ```
5. Run database migrations:
   ```bash
   npm run migrate   # runs the AdonisJS migrations against the container DB
   ```
6. Start the development servers (both API and frontend):
   ```bash
   # In one terminal
   cd api && npm run dev   # API on http://localhost:3333
   # In another terminal
   cd web && npm run dev   # Vite dev server on http://localhost:5173
   ```
7. Open the application in your browser:
   - Frontend: <http://localhost:5173>
   - API (for debugging): <http://localhost:3333>

### Testing & Linting
- Run the test suite (requires the Docker containers to be up):
  ```bash
  npm test
  ```
- Run ESLint to ensure code quality:
  ```bash
  npm run lint
  ```

---

## UI Screenshots (captured from LouveApp)
The following screenshots were automatically captured using a headless Puppeteer script. They represent the visual flow of the original LouveApp and serve as a reference for styling the Worship Brasa UI.

| # | Description | Image |
|---|-------------|-------|
| 01 | **Login screen** – initial entry point | ![01_login](file:///home/caiokl3i/.gemini/antigravity-ide/brain/8560827f-7b16-45f5-939e-c5c7c2a1db57/louve_screens/01_login.png) |
| 02 | **Typed login** – email & password fields filled | ![02_typed_login](file:///home/caiokl3i/.gemini/antigravity-ide/brain/8560827f-7b16-45f5-939e-c5c7c2a1db57/louve_screens/02_typed_login.png) |
| 03 | **Dashboard after login** – sidebar navigation & home view | ![01_dashboard_home](file:///home/caiokl3i/.gemini/antigravity-ide/brain/8560827f-7b16-45f5-939e-c5c7c2a1db57/louve_screens/01_dashboard_home.png) |
| 04 | **Schedules overview** | ![02_schedules](file:///home/caiokl3i/.gemini/antigravity-ide/brain/8560827f-7b16-45f5-939e-c5c7c2a1db57/louve_screens/02_schedules.png) |
| 05 | **Create schedule modal** | ![02_schedules_create_modal](file:///home/caiokl3i/.gemini/antigravity-ide/brain/8560827f-7b16-45f5-939e-c5c7c2a1db57/louve_screens/02_schedules_create_modal.png) |
| 06 | **Repertoire page** | ![03_repertoire](file:///home/caiokl3i/.gemini/antigravity-ide/brain/8560827f-7b16-45f5-939e-c5c7c2a1db57/louve_screens/03_repertoire.png) |
| 07 | **Posts feed** | ![04_posts](file:///home/caiokl3i/.gemini/antigravity-ide/brain/8560827f-7b16-45f5-939e-c5c7c2a1db57/louve_screens/04_posts.png) |
| 08 | **Announcements** | ![07_announcements](file:///home/caiokl3i/.gemini/antigravity-ide/brain/8560827f-7b16-45f5-939e-c5c7c2a1db57/louve_screens/07_announcements.png) |
| 09 | **Unavailability page** | ![08_unavailability](file:///home/caiokl3i/.gemini/antigravity-ide/brain/8560827f-7b16-45f5-939e-c5c7c2a1db57/louve_screens/08_unavailability.png) |
| 10 | **Settings** | ![12_settings](file:///home/caiokl3i/.gemini/antigravity-ide/brain/8560827f-7b16-45f5-939e-c5c7c2a1db57/louve_screens/12_settings.png) |
| 11 | **User profile** | ![13_user_profile](file:///home/caiokl3i/.gemini/antigravity-ide/brain/8560827f-7b16-45f5-939e-c5c7c2a1db57/louve_screens/13_user_profile.png) |

> **Note:** For any screen that could not be accessed (e.g., deep admin routes), the design follows the same component library and visual language defined in `web/src/index.css`. Feel free to extend the CSS variables or component classes to match new UI elements.

---

## Design System Highlights
- **Color palette** – defined via CSS variables (`--brand`, `--accent`, `--action`, …) supporting both light and dark themes.
- **Typography** – uses the *Inter* font family with a clear hierarchy (`h1`, `h2`, `h3`).
- **Cards & Lists** – rounded corners, subtle shadows (`--shadow-sm`, `--shadow-md`), and hover states that use the `--wash` background.
- **Sidebar navigation** – active link highlighting (`.side-link.active`) and smooth hover transitions.
- **Micro‑animations** – button opacity transitions, sidebar link hover effects, and dark‑mode toggle.

You can further customize the look by editing the CSS variables in `web/src/index.css`.

---

## Contributing
1. Fork the repository.
2. Create a feature branch:
   ```bash
   git checkout -b feature/awesome‑feature
   ```
3. Make your changes, ensure `npm run lint` passes, and add or update screenshots if UI changes.
4. Open a Pull Request.

---

## License
MIT © Worship Brasa team