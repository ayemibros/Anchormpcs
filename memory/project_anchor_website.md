---
name: project-anchor-website
description: ANCHORMPCS website project — cooperative society site being built with HTML/CSS/JS frontend and Node.js + MySQL backend planned
metadata:
  type: project
---

Building the website for **Anchor Multipurpose Cooperative Society (ANCHORMPCS)**.

**Key pages built:**
- `index.html` — premium landing page (hero, about, businesses, pillars, benefits, savings, contact)
- `membership.html` — full registration form (sections A–E + savings plan)
- `assets/css/anchor.css` — shared stylesheet (no external CSS dependencies in repo)

**Tech stack:** Bootstrap 5 CDN + Font Awesome 6 CDN (no local copies). Node.js + MySQL backend is planned but not yet built.

**Design system:** Navy (#0D1B2A) + Teal (#1A747B) + Gold (#C9A84C)

**Old Corva template files kept:** contact.html, gallery.html, service.html, login.html (user chose to keep them for potential repurposing)

**Why:** User has limited tokens; keep future changes targeted and efficient.

**How to apply:** Continue building the backend API endpoints at `/api/membership` for the form POST. Bank account details: First Bank 2048556639.
