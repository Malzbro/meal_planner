"""FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api import routes_plan, routes_recipes, routes_swap


app = FastAPI(
    title="Meal Planner API",
    description="Budget-aware weekly meal planning with RAG and LLM assistance",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(routes_plan.router)
app.include_router(routes_recipes.router)
app.include_router(routes_swap.router)


@app.get("/", tags=["health"])
def root():
    return {"status": "ok", "service": "meal-planner-api"}


@app.get("/health", tags=["health"])
def health():
    return {"status": "healthy"}