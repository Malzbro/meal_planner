"""Orchestrator: generate the full dataset by running every theme.

Features:
- Checkpoints after each batch (resumable if interrupted)
- Cross-batch deduplication
- Rate limiting (Gemini free tier: 15 RPM is comfortable)
- Progress logging
"""

import json
import time
from pathlib import Path

from generator.generate import generate_batch, deduplicate_by_title
from generator.schema import Recipe
from generator.themes import BATCH_THEMES


RECIPES_PER_THEME = 10
DATA_DIR = Path("../data/raw")
FINAL_OUTPUT = Path("../data/recipes.jsonl")
CHECKPOINT = Path("../data/checkpoint.json")
SLEEP_BETWEEN_BATCHES_SEC = 5  # respect ~15 req/min limit comfortably


def load_existing_titles() -> set[str]:
    """Read already-generated recipes so we can skip duplicates across runs."""
    if not FINAL_OUTPUT.exists():
        return set()
    titles = set()
    with open(FINAL_OUTPUT, "r", encoding="utf-8") as f:
        for line in f:
            r = json.loads(line)
            titles.add(r["title"].lower().strip())
    return titles


def load_checkpoint() -> int:
    """Resume from the last completed theme index."""
    if CHECKPOINT.exists():
        with open(CHECKPOINT, "r") as f:
            return json.load(f)["last_completed_index"]
    return -1


def save_checkpoint(index: int) -> None:
    CHECKPOINT.parent.mkdir(parents=True, exist_ok=True)
    with open(CHECKPOINT, "w") as f:
        json.dump({"last_completed_index": index}, f)


def append_recipes(recipes: list[Recipe]) -> None:
    FINAL_OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with open(FINAL_OUTPUT, "a", encoding="utf-8") as f:
        for r in recipes:
            f.write(r.model_dump_json() + "\n")


def main():
    start_index = load_checkpoint() + 1
    seen_titles = load_existing_titles()

    if start_index > 0:
        print(f"Resuming from theme {start_index} ({len(seen_titles)} recipes already saved)")
    else:
        print(f"Starting fresh. Generating ~{len(BATCH_THEMES) * RECIPES_PER_THEME} recipes...")

    total_added = 0
    for i in range(start_index, len(BATCH_THEMES)):
        theme = BATCH_THEMES[i]
        print(f"\n[{i + 1}/{len(BATCH_THEMES)}] {theme[:70]}")

        recipes = generate_batch(RECIPES_PER_THEME, theme)
        recipes = deduplicate_by_title(recipes)

        # cross-batch dedup
        new_recipes = [r for r in recipes if r.title.lower().strip() not in seen_titles]
        skipped = len(recipes) - len(new_recipes)
        for r in new_recipes:
            seen_titles.add(r.title.lower().strip())

        append_recipes(new_recipes)
        save_checkpoint(i)
        total_added += len(new_recipes)

        msg = f"  +{len(new_recipes)} new"
        if skipped:
            msg += f" ({skipped} cross-batch duplicates skipped)"
        msg += f"  |  total so far: {len(seen_titles)}"
        print(msg)

        if i < len(BATCH_THEMES) - 1:
            time.sleep(SLEEP_BETWEEN_BATCHES_SEC)

    print(f"\nDone. Added {total_added} new recipes in this run.")
    print(f"Total dataset: {len(seen_titles)} recipes in {FINAL_OUTPUT}")


if __name__ == "__main__":
    main()