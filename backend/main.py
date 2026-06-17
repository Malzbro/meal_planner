"""FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api import routes_plan, routes_recipes, routes_swap, routes_shopping


app = FastAPI(
    title="Meal Planner API",
    description="Budget-aware weekly meal planning with RAG and LLM assistance",
    version="0.1.0",
)

import os

allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(routes_plan.router)
app.include_router(routes_recipes.router)
app.include_router(routes_swap.router)
app.include_router(routes_shopping.router)


@app.get("/", tags=["health"])
def root():
    return {"status": "ok", "service": "meal-planner-api"}


@app.get("/health", tags=["health"])
def health():
    return {"status": "healthy"}