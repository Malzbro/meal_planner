from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Meal Planner API",
    description="Budget-aware weekly meal planning with RAG and LLM assistance",
    version="0.1.0",
)

# Allow the frontend (which will run on a different port) to talk to us
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite's default dev port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"status": "ok", "service": "meal-planner-api"}


@app.get("/health")
def health():
    return {"status": "healthy"}