"""Quick dataset health check."""

import json
from collections import Counter
from pathlib import Path

path = Path("../data/recipes.jsonl")
recipes = [json.loads(line) for line in open(path, encoding="utf-8")]

print(f"Total recipes: {len(recipes)}")
print(f"\nCuisines: {Counter(r['cuisine'] for r in recipes)}")
print(f"\nDietary tag frequency:")
tags = Counter(t for r in recipes for t in r['tags'])
for tag, count in tags.most_common():
    print(f"  {tag}: {count}")

costs = [sum(i['est_price_gbp'] for i in r['ingredients']) / r['servings'] for r in recipes]
print(f"\nCost per serving: min £{min(costs):.2f}, median £{sorted(costs)[len(costs)//2]:.2f}, max £{max(costs):.2f}")

cals = [r['calories_per_serving'] for r in recipes]
print(f"Calories per serving: min {min(cals)}, median {sorted(cals)[len(cals)//2]}, max {max(cals)}")