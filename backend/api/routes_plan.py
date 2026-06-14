"""POST /plan — generate a weekly meal plan."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from api.deps import get_db
from planner.planner import plan_week
from planner.schemas import PlanRequest, PlanResponse


router = APIRouter(tags=["plan"])


@router.post("/plan", response_model=PlanResponse)
def create_plan(request: PlanRequest, db: Session = Depends(get_db)) -> PlanResponse:
    """Generate a weekly meal plan from a budget and preferences."""
    try:
        return plan_week(db, request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Planning failed: {e}")