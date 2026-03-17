"""Grounded brew guides by method. No hallucination."""
from typing import Any

BASE_GUIDES: dict[str, dict[str, Any]] = {
    "espresso": {
        "grind": "Fine",
        "time": "25–32 seconds",
        "ratio": "1:2",
        "temp": "92–94°C",
        "tips": ["Use freshly ground beans", "Preheat your vessel"],
    },
    "pour_over": {
        "grind": "Medium",
        "time": "2:45–3:15",
        "ratio": "1:16",
        "temp": "93–96°C",
        "tips": ["Pre-wet the filter and bloom 30s", "Use a scale for consistent ratio"],
    },
    "french_press": {
        "grind": "Coarse",
        "time": "~4:00",
        "ratio": "1:15",
        "temp": "~94°C",
        "tips": ["Use freshly ground beans", "Preheat your vessel"],
    },
    "drip": {
        "grind": "Medium",
        "time": "Auto",
        "ratio": "1:17",
        "temp": "~93°C",
        "tips": ["Use freshly ground beans", "Clean your machine regularly"],
    },
    "aeropress": {
        "grind": "Medium",
        "time": "~1:45",
        "ratio": "1:12",
        "temp": "90–94°C",
        "tips": ["Inverted or standard method both work", "Experiment with steeping time"],
    },
}


def get_brew_guide(
    brew_method: str,
    low_acid: bool = False,
    low_bitterness: bool = False,
) -> dict[str, Any]:
    base = BASE_GUIDES.get(brew_method, BASE_GUIDES["pour_over"]).copy()
    tips = list(base.get("tips", []))

    if low_acid:
        tips.append("Lower temp slightly (88–91°C) to reduce perceived acidity")
        tips.append("Slightly coarser grind can soften bright notes")
    if low_bitterness:
        tips.append("Use coarser grind to reduce extraction of bitter compounds")
        tips.append("Lower water temp (88–92°C) helps avoid over-extraction")

    base["tips"] = tips
    return base
