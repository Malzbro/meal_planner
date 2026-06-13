"""Diversity seeds for recipe generation.

Each theme nudges the model toward a specific slice of the recipe space.
Running ~50 themed batches of 10 produces a diverse ~500-recipe dataset.
"""

BATCH_THEMES = [
    # Cuisine-focused
    "classic British comfort food (pies, stews, roasts, traditional puddings)",
    "Italian pasta and risotto dishes (regional variety, not just spaghetti bolognese)",
    "Indian curries and dals (varied regional styles: north, south, Bengali, Goan)",
    "Chinese stir-fries and rice dishes (Cantonese, Szechuan, home-style)",
    "Mexican mains and street food style dishes",
    "Mediterranean dishes (Greek, Spanish, Levantine, North African)",
    "Thai curries, noodles, and salads",
    "Japanese home cooking (donburi, noodle dishes, simple grills)",
    "Middle Eastern mains (Lebanese, Persian, Turkish)",
    "West and East African dishes (jollof, stews, injera-style)",

    # Protein-focused
    "chicken-based mains across various cuisines",
    "beef and lamb mains across various cuisines",
    "goat mains across various cuisines",
    "fish and seafood mains (budget options: mackerel, sardines, frozen white fish)",
    "egg-centric meals (frittatas, shakshuka, fried rice with egg, omelettes)",

    # Vegetarian / vegan
    "hearty vegetarian mains (not just salads)",
    "vegan mains with strong protein content (lentils, beans, tofu, chickpeas)",
    "vegetable-forward dishes that use seasonal produce",
    "bean and pulse-based mains (chilli, dal, casserole, soup)",

    # Format-focused
    "one-pot and tray-bake meals for minimal washing up",
    "stir-fries and quick wok dishes under 20 minutes",
    "soups and stews suitable for batch cooking",
    "pasta dishes beyond the obvious (baked pasta, stuffed pasta, fresh sauces)",
    "rice-based mains (pilaf, biryani, jambalaya, risotto)",
    "noodle-based mains (ramen-style, pad thai-style, lo mein, soba)",
    "salads substantial enough to be a main meal",
    "wraps, flatbreads, and stuffed pita mains",
    "casseroles and bakes",
    "skewers, kebabs, and grilled mains",

    # Constraint-focused
    "meals under 15 minutes total time for busy weeknights",
    "slow cooker and braised dishes for hands-off cooking",
    "air fryer-focused recipes",
    "high-protein meals aimed at 35g+ protein per serving",
    "low-calorie meals under 400 kcal per serving but still filling",
    "budget meals under £1 per serving",
    "meals that scale well to feed 6+ people for family dinners",
    "student-friendly dishes with minimal equipment (one pan, one pot)",

    # Meal-type variety
    "hearty breakfast and brunch mains",
    "lunch box and meal prep friendly mains that reheat well",
    "dishes that use store cupboard staples only",
    "freezer-friendly meals that can be batch-made and frozen",

    # Dietary
    "gluten-free mains across various cuisines",
    "dairy-free mains across various cuisines",
    "halal-friendly meals avoiding pork and alcohol",

    # Seasonal / occasion
    "warming winter meals with root vegetables",
    "light summer dishes for warm weather",
    "Sunday roast and weekend-special dishes",
    "comfort food classics from around the world",
]

# Sanity check: should produce close to 500 recipes when run at 10/batch
assert 40 <= len(BATCH_THEMES) <= 60, f"Expected 40-60 themes, got {len(BATCH_THEMES)}"