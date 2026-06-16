"""Quick smoke test of the swap extraction layer.

Run with: python -m api.test_swap_extraction
"""

from api.swap_extraction import extract_swap_constraints


CASES = [
    ("I don't want chicken", ["chicken"], []),
    ("no beans please", ["beans"], []),
    ("too spicy for me", [], "expect milder/less spicy terms"),
    ("anything except seafood", ["seafood"], []),
    ("sick of pasta and rice", ["pasta", "rice"], []),
    ("this is gross", [], []),
    ("", None, None),  # empty input
    ("want something lighter", [], "expect lighter term"),
]


def main():
    print("Testing swap extraction layer:\n")
    for reason, expected_excl, expected_sentiment in CASES:
        result = extract_swap_constraints(reason)
        print(f"Input: {reason!r}")
        if result is None:
            print(f"  -> None (expected: {expected_excl})")
        else:
            print(f"  -> excluded: {result.excluded_ingredients}")
            print(f"  -> sentiment: {result.sentiment_terms}")
        print()


if __name__ == "__main__":
    main()