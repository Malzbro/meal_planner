"""Production startup: ensure recipes are generated, loaded, indexed, then run the server.

This script is idempotent — on subsequent boots it skips work that's already done.
"""

import os
import subprocess
import sys
from pathlib import Path

DATA_DIR = Path(os.getenv("DATA_DIR", "/data"))
DATA_DIR.mkdir(parents=True, exist_ok=True)

JSONL = DATA_DIR / "recipes.jsonl"
DB = DATA_DIR / "recipes.db"
CHROMA = DATA_DIR / "chroma"


def run(cmd: list[str], description: str) -> None:
    print(f"\n[startup] {description}")
    result = subprocess.run(cmd, cwd=Path(__file__).parent)
    if result.returncode != 0:
        print(f"[startup] FAILED: {description}", file=sys.stderr)
        sys.exit(result.returncode)


def main():
    print(f"[startup] DATA_DIR = {DATA_DIR}")

    if not JSONL.exists():
        print("[startup] No recipes.jsonl found — generating dataset (this takes ~15 min)...")
        run([sys.executable, "-m", "generator.run_all"], "Generate recipes")
    else:
        print(f"[startup] Found existing recipes.jsonl ({JSONL.stat().st_size} bytes), skipping generation")

    if not DB.exists():
        print("[startup] No recipes.db found — loading dataset into SQLite...")
        run([sys.executable, "-m", "db.load"], "Load SQLite database")
    else:
        print(f"[startup] Found existing recipes.db, skipping load")

    if not CHROMA.exists() or not any(CHROMA.iterdir()):
        print("[startup] No Chroma index found — building it (this takes ~30s)...")
        run([sys.executable, "-m", "rag.index"], "Build Chroma index")
    else:
        print(f"[startup] Found existing Chroma index, skipping rebuild")

    print("\n[startup] All set. Starting uvicorn...\n")
    port = os.getenv("PORT", "8000")
    os.execvp(sys.executable, [sys.executable, "-m", "uvicorn", "main:app",
                               "--host", "0.0.0.0", "--port", port])


if __name__ == "__main__":
    main()