# StrayPet Thesis Project — Context Record

> Generated: 2026-02-28  
> Purpose: Resume context in a new Copilot session

---

## 1. Project Overview

**Thesis**: BSc Engineer's Thesis for **Warsaw University of Technology (WUT)**, Faculty EiTI  
**Title**: "Design and Implementation of a Full-Stack Web Application for Pet Adoption"  
**Language**: English  
**Student**: Chen Song, Album Number: 323844  
**Supervisor**: Zbigniew Szymański  
**Specialisation**: Left empty (removed from cover page)

**StrayPet** is a full-stack pet adoption platform:

- **Backend**: Django 5.1 + DRF 3.15, PostgreSQL 16 + PostGIS 3.4
- **Frontend**: React 19 + TypeScript, Vite 7 + SWC, MUI
- **Infrastructure**: Docker, Nginx
- **APIs**: 96 endpoints (not 87)

---

## 2. LaTeX Setup

- **Template**: WUT-Thesis (cloned from GitHub), located at `thesis/WUT-Thesis/`
- **Build tool**: MiKTeX at `C:\Users\alf13\AppData\Local\Programs\MiKTeX\`
- **Build command**:
  ```
  cd C:\Users\alf13\repo\StrayPet\thesis\WUT-Thesis
  pdflatex -interaction=nonstopmode main.tex
  biber main
  pdflatex -interaction=nonstopmode main.tex
  pdflatex -interaction=nonstopmode main.tex
  ```
- **Current PDF**: 76 pages, ~865KB, 0 errors

### Key Template Modifications

1. **wut-thesis.cls line 317**: Added conditional specialisation — `\ifx\@specjalnosc\empty\else` so the specialisation line doesn't appear on the cover when left empty.
2. **main.tex**: Added TikZ packages:
   ```latex
   \usepackage{tikz}
   \usetikzlibrary{shapes.geometric, shapes.symbols, arrows.meta, positioning, calc, fit, backgrounds, decorations.pathreplacing}
   ```
3. **xcolor** loaded with `[dvipsnames]` option
4. No Unicode box-drawing characters in `lstlisting` environments (causes build errors — use ASCII instead)
5. PDF must be **closed** before rebuilding (or use `-jobname=main_test` workaround)

---

## 3. Document Structure

```
main.tex
├── Abstract (English)
├── Streszczenie (Polish)
├── \makeauthorship (authorship declaration)
├── \makelicense (license declaration)
├── Table of Contents (auto-generated)
├── tex/1-introduction.tex      — Chapter 1: Introduction
├── tex/2-problem-analysis.tex  — Chapter 2: Problem Analysis & Requirements
├── tex/3-system-design.tex     — Chapter 3: System Design
├── tex/4-implementation.tex    — Chapter 4: Implementation Details
├── tex/5-testing.tex           — Chapter 5: Testing & Quality Assurance
├── tex/6-conclusions.tex       — Chapter 6: Conclusions
├── bibliografia.bib            — 28 entries (24 cited)
├── List of Figures
├── List of Tables
├── tex/appendix-a.tex          — Appendix A: API Endpoint Catalogue
├── tex/appendix-b.tex          — Appendix B: User Interface Screenshots
└── tex/appendix-c.tex          — Appendix C: Deployment Configuration
```

---

## 4. Diagrams Status

### Completed TikZ Diagrams (auto-generated)

| Figure  | File                   | Description                                                                                             | Status       |
| ------- | ---------------------- | ------------------------------------------------------------------------------------------------------- | ------------ |
| Fig 2.1 | 2-problem-analysis.tex | Use Case diagram — 3 actors, 16 use cases, 6 groups                                                     | ✅ Done      |
| Fig 3.1 | 3-system-design.tex    | Standard 3-tier architecture — Client/Server/Data tiers + External Services                             | ✅ Done (v3) |
| Fig 3.2 | 3-system-design.tex    | Standard UML sequence diagram — 4 participants, activation bars, 10-step adoption flow                  | ✅ Done (v3) |
| Fig 3.3 | 3-system-design.tex    | Standard ER diagram — 10 core entities in table format, 2×5 grid, 11 relationship lines, zero crossings | ✅ Done (v3) |
| Fig 3.4 | 3-system-design.tex    | ER diagram was originally here but after redesign it's Fig 3.3                                          | N/A          |

### Screenshot Placeholders Still Needed (12 total)

These require the user to take actual screenshots and replace the placeholder text.

**In Chapter 3 (3-system-design.tex) — 3 wireframes:**

- Placeholder #5: Home page wireframe
- Placeholder #6: Pet detail page wireframe
- Placeholder #7: User dashboard wireframe

**In Appendix B (appendix-b.tex) — 9 app screenshots:**

- Placeholder #8: Home page screenshot
- Placeholder #9: Pet listing with filters
- Placeholder #10: Pet detail page
- Placeholder #11: Lost pet report form
- Placeholder #12: Map view with markers
- Placeholder #13: User profile / dashboard
- Placeholder #14: Shelter management panel
- Placeholder #15: Admin panel overview
- Placeholder #16: Mobile responsive view

---

## 5. Factual Errors Found & Fixed

All of these have already been corrected:

1. **Supervisor placeholder** → Zbigniew Szymański
2. **Traits description** wrong → fixed to match actual model
3. **PetFilter "16 filter fields"** → corrected to **20** (fixed in 4 locations across chapters 3 and 6)
4. **Pet.Status choices** → corrected to match actual code
5. **Shelter field count** 18 → **19**
6. **Docker image** → `postgis/postgis:16-3.4`
7. **"Real-time messaging"** claim → changed to polling-based (no WebSocket in codebase)
8. **"87 endpoints"** → **96**
9. **MUI** added to frontend tech stack mentions

---

## 6. Key Code Facts (for thesis accuracy)

- **PetFilter** has **20** filter fields (not 16)
- **Pet model** Status choices: match what's in `backend/apps/pet/models.py`
- **Shelter model** has **19** fields
- **Docker image**: `postgis/postgis:16-3.4`
- **No WebSocket/real-time**: messaging uses polling
- **96 API endpoints** total
- **22 database tables** with GiST indexes for PostGIS
- **Frontend**: React 19 + TypeScript + Vite 7 + SWC + MUI + React Router + Axios
- **Auth**: JWT (SimpleJWT)

---

## 7. File Locations Quick Reference

| Purpose         | Path                                   |
| --------------- | -------------------------------------- |
| LaTeX root      | `thesis/WUT-Thesis/`                   |
| Main document   | `thesis/WUT-Thesis/main.tex`           |
| Bibliography    | `thesis/WUT-Thesis/bibliografia.bib`   |
| Chapter files   | `thesis/WUT-Thesis/tex/*.tex`          |
| Template class  | `thesis/WUT-Thesis/src/wut-thesis.cls` |
| Backend code    | `backend/`                             |
| Frontend code   | `frontend/`                            |
| Django settings | `backend/server/settings.py`           |
| API views       | `backend/api/views.py`                 |
| API serializers | `backend/api/serializers.py`           |
| API urls        | `backend/api/urls.py`                  |
| Pet models      | `backend/apps/pet/models.py`           |
| User models     | `backend/apps/user/models.py`          |

---

## 8. Known Constraints & Gotchas

1. **No landscape pages** — user wants printable thesis, landscape breaks printing
2. **`twoside` document class** — blank pages between chapters are normal (recto-verso)
3. **TOC auto-generated** — no manual TOC needed
4. **Close PDF before rebuild** — MiKTeX can't overwrite open PDF
5. **No Unicode in lstlisting** — use ASCII art for code blocks
6. **Bibliography**: biber (not bibtex) — must run `biber main` between pdflatex passes

---

## 9. What Remains To Do

1. **12 screenshot placeholders** — user needs to take screenshots and insert them
2. **Review diagrams** — user may want further adjustments to Fig 3.1, 3.2, 3.3
3. **Fig 2.1 (Use Case)** — was not part of latest redesign, may need similar update
4. **Final proofreading** — content is verified against code but stylistic review may be needed
5. **Page count** — currently 76 pages (target was 50+, achieved)

---

## 10. How to Resume

Paste this to the new Copilot session:

> I'm working on a BSc thesis in LaTeX for Warsaw University of Technology (WUT) about my StrayPet pet adoption web app. The workspace is at `c:\Users\alf13\repo\StrayPet`. The thesis files are in `thesis/WUT-Thesis/`. Please read `thesis/CONTEXT.md` for full project context from my previous session, then help me continue.
