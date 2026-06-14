"""Show the planner working end-to-end."""

from db.session import SessionLocal
from planner.planner import plan_week
from planner.schemas import PlanRequest


session = SessionLocal()


def show(label: str, response):
    print(f"\n=== {label} ===")
    print(f"Total: £{response.total_cost_gbp:.2f} of £{response.budget_gbp:.2f} "
          f"({response.budget_utilization:.0%} used)")
    print(f"Avg calories: {response.avg_calories_per_serving:.0f} kcal/serving")
    print(f"Cuisine diversity: {response.cuisine_diversity} distinct cuisines")
    for m in response.meals:
        print(f"  £{m.total_cost_gbp:5.2f}  |  {m.calories_per_serving} kcal  "
              f"|  {m.cuisine:14}  |  {m.title}")
    for w in response.warnings:
        print(f"  ⚠ {w}")


# Scenario 1: family of four, modest budget, varied food
show("Family of 4, £30 budget, varied food", plan_week(session, PlanRequest(
    weekly_budget_gbp=30.0,
    household_size=4,
    target_calories_per_serving=550,
    preference_text="hearty family-friendly dinners with variety",
)))

# Scenario 2: vegetarian student, tight budget
show("Vegetarian student, £12 budget", plan_week(session, PlanRequest(
    weekly_budget_gbp=12.0,
    household_size=1,
    target_calories_per_serving=600,
    required_tags=["vegetarian"],
    preference_text="quick easy student food",
)))

# Scenario 3: high-protein, no oven
show("High-protein, no oven, £25 budget", plan_week(session, PlanRequest(
    weekly_budget_gbp=25.0,
    household_size=2,
    target_calories_per_serving=650,
    required_tags=["high_protein"],
    excluded_appliances=["oven"],
    preference_text="filling protein-rich meals",
)))

# Scenario 4: impossible budget — should warn
show("Impossible: £3 for 4 people for the week", plan_week(session, PlanRequest(
    weekly_budget_gbp=3.0,
    household_size=4,
    preference_text="anything",
)))


session.close()