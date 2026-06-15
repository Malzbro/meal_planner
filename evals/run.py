"""Run the evaluation harness against the planner.

Usage:
    python -m evals.run

Outputs:
    - Console summary
    - Markdown report at evals/runs/<timestamp>.md
"""

import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from db.session import SessionLocal
from planner.planner import plan_week

from evals.test_cases import TEST_CASES
from evals.properties import (
    check_budget,
    check_calorie_target,
    check_dietary_compliance,
    check_appliance_compliance,
    check_diversity,
)


def run_one(name, request, session):
    plan = plan_week(session, request)
    results = {
        "budget": check_budget(request, plan),
        "calories": check_calorie_target(request, plan),
        "dietary": check_dietary_compliance(request, plan, session),
        "appliance": check_appliance_compliance(request, plan, session),
        "diversity": check_diversity(request, plan),
    }
    return plan, results


def main():
    session = SessionLocal()
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    report_path = Path(__file__).resolve().parent / "runs" / f"{timestamp}.md"
    report_path.parent.mkdir(parents=True, exist_ok=True)

    # Aggregate counters
    totals = {"budget": [0, 0], "calories": [0, 0], "dietary": [0, 0],
              "appliance": [0, 0], "diversity": [0, 0]}
    overall_pass = 0

    lines: list[str] = []
    lines.append(f"# Eval Run — {timestamp}\n")
    lines.append(f"Total test cases: {len(TEST_CASES)}\n")
    lines.append("\n## Per-case results\n")

    print(f"Running {len(TEST_CASES)} test cases...\n")

    for i, (name, request) in enumerate(TEST_CASES, 1):
        plan, results = run_one(name, request, session)

        passed_count = sum(1 for passed, _ in results.values() if passed)
        all_passed = passed_count == len(results)
        if all_passed:
            overall_pass += 1

        # Update totals: index 0 = passed, index 1 = total
        for prop, (passed, _) in results.items():
            totals[prop][1] += 1
            if passed:
                totals[prop][0] += 1

        # Console summary line
        marks = "".join("✓" if r[0] else "✗" for r in results.values())
        print(f"[{i:2}/{len(TEST_CASES)}] {marks}  {name}")

        # Markdown detail
        lines.append(f"### {i}. {name}\n")
        lines.append(f"- Budget: £{request.weekly_budget_gbp}, household {request.household_size}, "
                     f"target {request.target_calories_per_serving} kcal\n")
        if request.required_tags:
            lines.append(f"- Required tags: {request.required_tags}\n")
        if request.excluded_appliances:
            lines.append(f"- Excluded appliances: {request.excluded_appliances}\n")
        if request.preference_text:
            lines.append(f"- Preference: \"{request.preference_text}\"\n")
        lines.append(f"- Returned {len(plan.meals)} meals, "
                     f"£{plan.total_cost_gbp:.2f} total, "
                     f"{plan.avg_calories_per_serving:.0f} avg kcal\n\n")
        lines.append("| Property | Result | Detail |\n|---|---|---|\n")
        for prop, (passed, detail) in results.items():
            mark = "✅" if passed else "❌"
            lines.append(f"| {prop} | {mark} | {detail} |\n")
        lines.append("\n")

    # Summary
    lines.append("## Summary\n\n")
    lines.append(f"**Overall pass rate** "
                 f"(all 5 properties passed): {overall_pass}/{len(TEST_CASES)} "
                 f"({overall_pass / len(TEST_CASES) * 100:.0f}%)\n\n")
    lines.append("| Property | Pass rate |\n|---|---|\n")
    for prop, (passed, total) in totals.items():
        pct = passed / total * 100 if total else 0
        lines.append(f"| {prop} | {passed}/{total} ({pct:.0f}%) |\n")

    report_path.write_text("".join(lines), encoding="utf-8")

    # Console summary
    print("\n" + "=" * 60)
    print(f"Overall pass rate: {overall_pass}/{len(TEST_CASES)} "
          f"({overall_pass / len(TEST_CASES) * 100:.0f}%)")
    for prop, (passed, total) in totals.items():
        pct = passed / total * 100 if total else 0
        print(f"  {prop:12} {passed:2}/{total:2}  ({pct:3.0f}%)")
    print(f"\nFull report: {report_path}")

    session.close()


if __name__ == "__main__":
    main()