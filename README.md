# Meal Planner

A budget-aware weekly meal planning app with AI-assisted recipe selection.

## Status
see [docs/roadmap.md](docs/roadmap.md)

## Tech stack
- Backend: FastAPI (Python)
- Database: SQLite + Chroma (vector store)
- LLM: Google Gemini 2.5 Flash or Alternative Ai
- Frontend: React + Vite + Tailwind + shadcn/ui
- Deployment: Vercel (frontend) + Railway (backend)

## Dataset

373 recipes generated via a themed-batch pipeline with Pydantic schema
validation, cross-batch deduplication, and resumable checkpointing.
Generation uses Gemini 2.5 Flash as the primary provider with automatic
fallback to Groq's Llama 3.3 70B when free-tier rate limits are hit.

Prices are LLM-estimated UK budget supermarket prices (Aldi/Lidl level),
not live data. Calories are model-estimated, not lab-measured. Both are
plausible enough for budget planning; neither is ground truth.

## Scoring Function

Developed a scoring function that score how close a recipe is to the plan 
request. Based on Calories, Cost, Relevance, and Cuisine type. 
The function uses weights, they help determine which are most important, 
Calorie fit and relevance domniate out of the 4 choices. 

## Evaluation

The planner is measured by an automated eval harness over 26 test cases covering
budget range, dietary constraints, appliance exclusions, household sizes, and
deliberately-hard stress cases (conflicting preferences, heavily-constrained
candidate pools, edge calorie targets).

Each plan is checked against 5 quality properties:

| Property | Pass rate | Notes |
|---|---|---|
| Budget adherence | 26/26 (100%) | Hard constraint, enforced in the greedy selection loop |
| Dietary compliance | 26/26 (100%) | Hard constraint, enforced via SQL pre-filter on the candidate pool |
| Appliance compliance | 26/26 (100%) | Hard constraint, enforced via SQL pre-filter on the candidate pool |
| Cuisine diversity | 26/26 (100%) | Soft target (≥3 cuisines), enforced via diversity penalty in scoring |
| Calorie targeting | 23/26 (88%) | Soft target (±20% of requested), bounded by dataset distribution |

Hard constraints pass at 100% because they're enforced in code (SQL filters, greedy budget check), not in LLM heuristics. The three calorie-target failures are concentrated in two failure modes:

- **Dataset-bound failures**: requesting an average of 1000 kcal/serving when the dataset's recipes max out at 850 kcal — mathematically unachievable regardless of algorithm.
- **Candidate-pool-bound failures**: stacking multiple dietary and appliance constraints shrinks the legal recipe subset to 15-30 candidates. Within these small pools, the planner cannot simultaneously optimize for calorie targeting and the other soft signals; it returns the best available compromise rather than refusing to plan.

Both failure modes are correct behavior — a planner that hit impossible targets by ignoring constraints would be worse than one that surfaces honest "best available" results. The eval makes these limits visible and measurable rather than hidden.

Run the evals with `python -m evals.run`. Reports are written to `evals/runs/`.