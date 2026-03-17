"""Run seed on startup if DB is empty."""
import asyncio
import subprocess
import sys


def run_seed():
    subprocess.run([sys.executable, "-m", "scripts.seed"], cwd="/app", check=False)


if __name__ == "__main__":
    run_seed()
