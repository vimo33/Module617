# Module 617 – Static Website (GitHub Pages)

This is a **static** (no-backend) learning website for **Module 617** (DE-only).

## What’s inside
- Phase pages: `index.html`, `phase-1.html` … `phase-5.html`
- Template library + individual template pages (annotated preview + DOCX download)
- Resource Hub page (readings) + readings embedded in each phase
- Local-only progress (checkboxes) via `localStorage`
- Simple shared password gate (client-side)

## Quick start (local)
Just open `index.html` in a browser.

For a nicer local dev experience (optional):
```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

## Change the shared password
Open `assets/app.js` and change:
```js
const PASSWORD = "module617";
```

## GitHub Pages setup (recommended)
1. Create a GitHub repo (e.g. `module-617-site`)
2. Upload all files from this folder to the repo root
3. In GitHub: **Settings → Pages**
   - Source: **Deploy from a branch**
   - Branch: `main` (root)
4. Wait for Pages to publish. Your URL will look like:
   `https://<username>.github.io/<repo>/`

### Notes
- This is **not** real authentication. The password gate is meant for basic cohort access only.
- Progress is stored per device/browser in `localStorage`. Students can export/import via **Hilfe**.

## Updating content
- Phase copy is embedded in the HTML files.
- DOCX templates live in `assets/templates/`.
- Reading list data lives in `assets/resources.json`.

