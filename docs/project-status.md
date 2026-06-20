# Pantry — Project Status & Roadmap

*Last updated: June 15, 2026*

A living document tracking what's been built, what's live, and where the project is going next.

---

## Project Overview

**Pantry** is a budget-aware weekly meal planner. It combines retrieval-augmented generation (RAG), constraint-satisfaction planning, and a curated recipe dataset to turn a weekly budget into a real plan of 7 meals — fitting dietary, appliance, and calorie constraints.

The interesting engineering problem isn't *generating* recipes (LLMs do that fine). It's *selecting* recipes from a curated set under stacked constraints, with arithmetic correctness, dietary safety, and reasonable variety. That's solved with deliberate code architecture, not with prompts.

- **Live demo:** https://meal-planner-livid-eight.vercel.app/
- **GitHub:** https://github.com/Malzbro/meal_planner
- **Started:** June 2026
- **Current status:** V1 shipped and deployed. Polish phase in progress.

---

## What's Been Built (V1, shipped)

### Generation pipeline
- 373-recipe dataset generated locally, 93 recipes generated on the deployed instance (cut short by free-tier rate limits).
- Themed-batch generation across ~50 themes (cuisines, proteins, appliance constraints, dietary needs) to ensure variety by construction.
- Multi-provider LLM abstraction: Gemini 2.5 Flash as primary, automatic fallback to Groq's Llama 3.3 70B when rate limits are hit. The rest of the codebase calls a single `generate_json(prompt)` function and doesn't know which provider responded.
- Pydantic schema validation on every recipe (constrained cuisine values, ingredient structure, step length minima, calorie ranges). Invalid recipes are dropped before storage.
- Cross-batch deduplication by title.
- Resumable checkpointing — if generation crashes or hits rate limits, the next run picks up where it stopped.

### Storage layer
- SQLite database accessed via SQLAlchemy ORM.
- Normalised schema: recipes ↔ ingredients/steps (one-to-many), recipes ↔ tags/appliances (many-to-many via junction tables).
- Indexed columns on cost, calories, and cuisine for fast filtering.
- Loader script that's idempotent and rebuilds from the JSONL source of truth.

### Retrieval (RAG)
- Local embeddings via `sentence-transformers/all-MiniLM-L6-v2` (384-dim, ~90MB, runs free on CPU).
- Chroma vector store, persisted to disk.
- Deliberate text representation for embeddings: title + cuisine + tags + top-6 ingredients by weight + appliances. (Steps and quantities excluded — they're implementation, not identity.)
- **Hybrid search**: SQL pre-filters the candidate pool on hard constraints (budget, dietary tags, excluded appliances, cuisines), then vector search ranks the filtered subset by semantic similarity to the user's preference text. Hard rules in code, soft signals in embeddings.

### Planning algorithm
- Greedy meal selection with **per-iteration budget-pressure reweighting**.
- Iteration loop: recompute fitness scores every step based on remaining budget per remaining meal — so cheap dishes become more attractive as the budget tightens.
- Cuisine diversity penalty (soft, not strict ban) to encourage variety.
- Surfaces honest warnings ("only fit N meals within budget") rather than producing nonsense.
- V1→V2 iteration: original V1 failed on tight-budget scenarios (classic greedy-knapsack failure). V2 fixed it after evals exposed the bug. The fix itself is a portfolio-worthy story.

### API
- FastAPI backend with dependency injection (database sessions managed via FastAPI's `Depends`).
- Endpoints:
  - `POST /plan` — generate a weekly meal plan
  - `GET /recipes/{id}` — fetch full recipe details
  - `POST /swap` — replace a meal in the plan with a contextually appropriate alternative
  - `GET /health` — liveness check
  - `GET /docs` — auto-generated OpenAPI documentation
- CORS configured via environment variable for production deployment.
- Pydantic request/response schemas independent of database models (clean API contract layer).

### Frontend
- React + Vite + TypeScript + Tailwind.
- Custom design system: warm off-white (#FAFAF8) background, near-black ink, deep aubergine accent (#6B2737), serif display face (Fraunces) paired with Inter body and JetBrains Mono for numerics.
- Three primary screens: input form → plan view → recipe detail modal.
- Signature element: animated budget allocation bar at the top of the plan view, making constraint-satisfaction visible.
- Loading skeleton on plan generation.
- Staggered card animations on plan reveal (60ms-cascade).
- Modal slide-up animation with backdrop fade.
- In-modal swap flow with free-text reason input.
- Client-side plan recomputation after swap (totals, diversity, budget bar update instantly).
- Responsive: works on mobile-sized viewports.

### Evaluation harness
- 26 automated test cases covering budget range, dietary constraints, appliance exclusions, household sizes, preference text varieties, and deliberately hard stress cases.
- 5 quality properties measured per case: budget adherence, dietary compliance, appliance compliance, cuisine diversity, calorie targeting.
- Markdown reports with per-case detail and aggregate stats, saved to `evals/runs/<timestamp>.md`.
- **Current results (26 cases):**
  - Budget adherence: 26/26 (100%)
  - Dietary compliance: 26/26 (100%)
  - Appliance compliance: 26/26 (100%)
  - Cuisine diversity: 26/26 (100%)
  - Calorie targeting: 23/26 (88%)
- Failure analysis distinguishes *dataset-bound* (target unreachable for the data) vs *candidate-pool-bound* (constraints stacked too tightly) failure modes.

### Deployment
- **Frontend:** Vercel, auto-deploys from GitHub on every push, free tier.
- **Backend:** Railway, Docker container with persistent volume for SQLite DB and Chroma index, ~$5/month tier.
- Startup script that's idempotent — regenerates data only if missing, otherwise just starts uvicorn.
- Embedding model pre-downloaded at container build time to avoid first-request latency.
- CORS locked to production Vercel domain.
- Environment-based configuration (no hardcoded paths or secrets).
- Live and publicly reachable.

### Documentation
- Comprehensive README with screenshot, architecture diagram, evaluation results, known limitations, and run-locally instructions.
- Architecture diagram showing the data flow and the "hard rules / soft signals" split.
- This status document.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Backend language | Python 3.12 |
| API framework | FastAPI |
| ORM | SQLAlchemy |
| Database | SQLite |
| Validation | Pydantic |
| Vector store | Chroma |
| Embeddings | sentence-transformers MiniLM-L6-v2 |
| LLM (primary) | Google Gemini 2.5 Flash |
| LLM (fallback) | Groq Llama 3.3 70B |
| Frontend framework | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS + tailwindcss-animate |
| Frontend deployment | Vercel |
| Backend deployment | Railway (Docker) |
| Version control | Git + GitHub |

---

## Engineering Talking Points (for CV / interviews)

These are the things worth highlighting in conversations, in order of impact:

1. **Hybrid retrieval design** — "SQL filters hard constraints; embeddings rank soft signals." Demonstrates understanding of when to use embeddings and when not to.

2. **Provider abstraction with fallback** — Resilience pattern. Shows production thinking, not just demo thinking.

3. **Schema-driven LLM output validation** — Pydantic schemas constraining LLM output. Standard professional pattern.

4. **V1 → V2 iteration on the planner** — Built greedy planner, evals caught budget-knapsack failure, redesigned with per-iteration reweighting. Demonstrates measurement-driven iteration.

5. **Eval harness with categorised failure analysis** — 26 cases, 5 properties, with a coherent story about *why* the 88% calorie pass rate is dataset-bound vs algorithm-bound. Shows you can distinguish "we built it badly" from "the data limits what's possible."

6. **Deliberate architecture choices** — "Arithmetic and constraints in code; semantic ranking and generation in LLMs." This split is the architectural thesis of the project.

---

## Known Limitations (documented, not pretending otherwise)

| Limitation | Why it matters | Plan |
|---|---|---|
| Prices and calories are LLM-estimated | Plausible but not measured | Out of scope for V1; would require real grocery/nutrition APIs |
| Backend cold-starts in 15–25 seconds | Free tier sleeps when idle | Document in README; acceptable for portfolio demo |
| Halal (30) and low-carb (4) tags under-represented | Dataset bias from generation prompts | Phase B: targeted generation runs |
| Recipes store all quantities in grams, including liquids | The dataset was generated with a single `grams` field per ingredient; liquids like oil and stock are stored as grams (close to ml but not unit-honest). Shopping list compensates by displaying known liquids as ml on the frontend, but the underlying data is technically incorrect. Pricing also treats some liquid quantities as if they were solid weights. | Future: regenerate dataset with `unit: g \| ml \| tbsp \| tsp \| whole` field per ingredient; update pricing prompts; add unit-aware aggregation logic. ~4-6 hours of work. |

---

## Roadmap (Phased)

### Phase A — Land Pantry properly *(done, ~1 week)*

The goal of this phase is to convert the engineering work into actual interviews. Most of the high-leverage work here is *presentation*, not code.

- [x] Build and deploy V1 end-to-end (frontend + backend, live URL)
- [x] Write a comprehensive README with architecture diagram and evaluation results
- [x] Document known limitations honestly
- [x] Build LinkedIn profile from scratch
- [x] Write a CV with Pantry as the centerpiece
- [x] Write and publish the LinkedIn launch post
- [x] Upload the full 373-recipe JSONL to Railway's persistent volume so the live demo matches the eval results
- [x] Pin the GitHub repo on profile and add topics (`rag`, `llm`, `fastapi`, `react`, `python`, `ai-engineering`)
- [x] Add screenshot/short demo video to the README and LinkedIn post

- [x] **Negation fix in swap (V2)** — extract excluded ingredients from the swap reason using LLM structured output, filter candidates by ingredient match in code, then run semantic search on the filtered pool. The "chat/preference loop" milestone from the original roadmap.
- [x] **Provider abstraction shape-awareness** — extended `generate_json(prompt, expect=...)` so callers can declare whether they want an object or list response, making the Gemini→Groq fallback preserve response shape across both recipe generation (lists) and structured extraction (objects).

### Phase B — Polish web app with the best ideas from competing apps *(3–5 days, after Phase A)*

After studying a polished competitor app (similar concept, "Herbia"-style branding), the best ideas to port into Pantry's web frontend without copying the visual aesthetic:

- [x] **Multi-step onboarding flow** — replaced single long form with 5-step wizard (budget → vibe → dietary → appliances → freeform). Sliding transitions between steps; calorie target hidden behind "advanced options" on Step 5.
- [x] **"Vibe" abstraction** — eight human categories (Quick & Easy, Healthy Comfort, Fakeaway, Family Friendly, High Protein, Plant-Forward, World Food, Budget Stretch) that translate to preference text + dietary tags + cuisine bias entirely client-side; backend doesn't know vibes exist.
- [x] **Plan reveal celebration moment** — V2 redesigned as a ~3-second deliberate sequence with a leaf bloom (SVG stroke animation), serif headline reveal, count-up numbers, and a settle beat. Makes the constraint-satisfaction feel earned.
- [x] **Illustrated kitchen-appliances picker** — V1 shipped (icons on a counter scene). V2 refinement deferred: integrate icons into the background scene and add a pop-out animation on selection so picking feels physical.
- [x] **Aggregated shopping list view** — backend endpoint that normalises, aggregates, scales, rounds, and categorises ingredients across the week's plan; frontend tab view with check-off interaction.
- [x] **Stochastic diversity in planner** — replaced deterministic top-pick with softmax-weighted sampling over top-N candidates. Hard constraints remain deterministic.
- [x] **Hand-built data visualisations** — cost breakdown bar (per-meal segments, sorted by cost, hover-isolate behaviour) and calorie distribution chart (vertical bars with dashed target reference line). No chart library.
- [x] **Plan view restructured as a 4-card dashboard with bottom-sheet detail panels** — Budget, Shopping list, Pantry (placeholder), Stats. Cards remain visible; clicking raises a bottom sheet with details. Strengthened card outlines for more presence.
- [x] **Recurring leaf motif as Pantry's identity element** — single ownable shape used in header, favicon, plan reveal, and stat separators. Restraint as identity.
- [x] **Dark mode** — CSS custom properties for semantic colors (--bg, --ink, --accent, etc.) with light and dark counterparts; toggle button (top-right, sun/moon icon); persists to localStorage; respects OS preference on first visit.
- [x] **Polish round** — favicon, cold-start "warming up" message on the plan button after 5s/12s, Open Graph meta tags for link previews, page title and description updated.
- [ ] **Confidence-aware messaging** — when hybrid_search returns low similarity scores across all candidates, surface that to the user instead of pretending the top result is great.

### Phase C — Mobile app *(2–4 weeks, after Phases A and B)*

Once the web version is fully landed and a couple of cycles of feedback have been collected, consider building a mobile companion.

- [ ] React Native + Expo as the foundation (transferable knowledge from web React)
- [ ] Backend reuses existing FastAPI endpoints — no new backend work needed
- [ ] Mobile-native patterns: bottom tab navigation, native gestures, haptic feedback on key actions
- [ ] Skip the App Store for V1 — Expo preview build + screenshots + 30-second demo video is sufficient for portfolio purposes
- [ ] Take the lessons from Phase B's polished web app and apply them with mobile-native conventions
- [ ] Pantry feature (Phase C candidate) — user marks ingredients they
  already have; shopping list automatically filters those out. Persists
  in localStorage initially, would be account-bound when auth is added.
  Demonstrates state synchronization between two views and is the
  natural "next user-facing feature" after shopping list.

### Phase D — Product validation *(decision point, after Phase B)*

The project started as a CV piece but the polish work has brought it close to a state worth testing as a real product. Before continuing engineering, the most valuable next step is genuine user feedback.

- [ ] **Get 10–20 real users to try the live demo** — friends, family, students at Nottingham, a small Reddit post on r/UKPersonalFinance or r/MealPrepSunday. The point is to find out whether there's actual demand before investing in product-grade infrastructure.
- [ ] **Decide based on feedback:** if there's real interest, the product roadmap (below) becomes the priority; if not, return to portfolio mode and start the next CV project.

### Phase F — Product-grade infrastructure *(only if Phase C signals demand)*
Concrete gaps between "deployed demo" and "real product people pay for or rely on":

- [ ] **Real grocery price integration** — Aldi/Lidl/Tesco pricing via aggregator APIs or a small price-scraping service. LLM-estimated prices are fine for a demo, not for a product. ~1–2 weeks.
- [ ] **Real nutrition data** — USDA FoodData Central API (free, comprehensive) mapped to the ingredient table. ~3–4 days. Replaces LLM-estimated calories.
- [ ] **Unit-aware recipe schema regeneration** — current `grams` field treats liquids incorrectly. Regenerate with `unit: g | ml | tbsp | tsp | whole`, update pricing prompts, add unit-aware aggregation. ~4–6 hours.
- [ ] **Accounts and persistence** — Clerk or Supabase Auth, user profile, saved preferences, favourites, cooking history. Real product means state survives between sessions.
- [ ] **PWA / mobile** — service worker, offline capability, installable, push notifications. Cheaper than native; the right call for a "use this in the supermarket" tool.
- [ ] **Dataset expansion** — 373 recipes is enough for a demo; a product wants 2,000+ with proper categorisation. Recipe images are the hardest sub-problem.
- [ ] **Stripe integration** — only relevant if a paid tier is planned.
- [ ] **Differentiator positioning** — "AI meal planner" is saturated. Pantry's real differentiators are UK budget focus and constraint-satisfaction-first design (most competitors let you blow your budget). These need to live in the product positioning, not just the README.


## User-Discovered Issues (V2 candidates)

Issues found through dogfooding the app, prioritised but deferred for batched future work:

- **Stochastic diversity** — fixed (June 2026): planner was deterministic, producing identical plans for identical inputs. Replaced with softmax-weighted sampling.
- **Negation in swap queries** — fixed (June 2026): "no chicken" was treated as semantically similar to chicken. Added LLM-driven structured extraction.
- **Unit unawareness for liquids** — open: ingredient quantities are all in grams; liquids should be ml. Frontend display workaround in place.
- **Pantry-staple noise in shopping lists** — fixed (June 2026): water/salt/pepper were appearing on shopping lists; added a staple-name filter.
- **Illustrated kitchen-appliances picker — refinement deferred:** initial implementation ships icons on a counter scene; the appliances feel slightly disconnected from the background. Planned V2: integrate appliances into the background as part of a single composed illustration, with a subtle "pop-out" / lift animation on selection so picking one feels physical rather than a state toggle.
- **"Web app feels too plain" — addressed:** dogfooding revealed that despite functional polish, the app lacked a sense of place. Addressed via the recurring leaf motif (identity), the theatrical plan reveal (a real climax moment), card outlines for more presence, and the dark mode (which doubled as a sense of "real product" through a familiar app affordance). The combined effect made each screen feel like Pantry rather than a generic template.

### Phase E - Other portfolio projects

After Pantry has done its job, the natural next moves depend on which role types are showing interest:

- **If AI/ML engineering interest is strong** — build a second project demonstrating a *different* skill axis: maybe a model evaluation framework, an agent system with tool use, a real fine-tuning project on a small open model, or a retrieval system with proper observability.
- **If full-stack with AI interest is strong** — a SaaS-shaped project (multi-tenant, auth, billing) using LLMs as a feature rather than the centerpiece.
- **If the EE background is still relevant** — something that bridges hardware and AI: edge ML on a Raspberry Pi, real-time signal processing with a model, or sensor data analysis.

## Future Potential Ideas


---

## Useful Commands Reference

```bash
# Backend (from backend/ folder with venv active)
python -m generator.run_all       # Generate full recipe dataset
python -m db.load                 # Load JSONL into SQLite
python -m rag.index               # Build Chroma vector store
uvicorn main:app --reload         # Run dev server

# Evaluation (from project root)
python -m evals.run               # Run the eval harness

# Frontend (from frontend/ folder)
npm run dev                       # Run dev server
npm run build                     # Production build

# Git rhythm
git status                        # Always before committing
git add <specific paths>          # Specific over `git add .`
git commit -m "..."               # Descriptive commit messages tell a story
git push                          # Triggers Vercel + Railway redeploys
```

---

## File Layout

```
meal-planner/
├── backend/
│   ├── generator/       Recipe generation pipeline (themed batches, schema, dedup, checkpoints, provider abstraction)
│   ├── db/              SQLAlchemy models, loader, query layer
│   ├── rag/             Embeddings, Chroma index, hybrid search
│   ├── planner/         Constraint-satisfaction meal planning
│   ├── api/             FastAPI routers (plan, recipes, swap)
│   ├── main.py          App entry point
│   ├── startup.py       Production startup script
│   ├── Dockerfile       Railway deployment
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/  PlannerForm, PlanView, PlanSkeleton, RecipeModal
│   │   ├── lib/         api.ts, utils.ts
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
├── evals/               Evaluation harness (test cases, properties, runner)
│   └── runs/            Markdown reports per eval run
├── data/                Generated artifacts (gitignored): recipes.jsonl, recipes.db, chroma/
├── docs/                README assets, architecture diagram, this roadmap
└── README.md
```

---

*This document is intentionally honest about both what's been done and what's planned. It's a living artifact.