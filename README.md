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