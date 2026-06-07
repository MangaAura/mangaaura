#!/usr/bin/env python3
"""Add missing home.newsCategory* and admin.newsForm.categoryLabels.* keys."""

import json
import sys

sys.stdout.reconfigure(encoding='utf-8')  # noqa

HOME_KEYS_ES = {
    "tools": "HERRAMIENTAS",
    "mobile": "MOVIL",
    "contest": "CONCURSO",
    "comparison": "COMPARATIVA",
    "features": "FUNCIONALIDADES",
    "technology": "TECNOLOGIA",
    "creator": "CREADORES",
}

HOME_KEYS_EN = {
    "tools": "TOOLS",
    "mobile": "MOBILE",
    "contest": "CONTEST",
    "comparison": "COMPARISON",
    "features": "FEATURES",
    "technology": "TECHNOLOGY",
    "creator": "CREATORS",
}

ADMIN_LABELS_ES = {
    "features": "Funcionalidades",
    "technology": "Tecnologia",
    "creator": "Creadores",
}

ADMIN_LABELS_EN = {
    "features": "Features",
    "technology": "Technology",
    "creator": "Creators",
}

KEY_MAP = {
    "mobile": "newsCategoryMobile",
    "contest": "newsCategoryContest",
    "comparison": "newsCategoryComparison",
    "features": "newsCategoryFeatures",
    "technology": "newsCategoryTechnology",
    "creator": "newsCategoryCreator",
    "tools": "newsCategoryTools",
}

for lang in ["es", "en"]:
    path = f"src/i18n/locales/{lang}.json"
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Add home.newsCategory* keys
    home_keys = HOME_KEYS_ES if lang == "es" else HOME_KEYS_EN
    for key, val in home_keys.items():
        data["home"][KEY_MAP[key]] = val

    # Add admin.newsForm.categoryLabels.* keys
    admin_labels = ADMIN_LABELS_ES if lang == "es" else ADMIN_LABELS_EN
    for key, val in admin_labels.items():
        data["admin"]["newsForm"]["categoryLabels"][key] = val

    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print(f"Updated {lang}.json")
    print(f"  home keys added: {list(home_keys.keys())}")
    print(f"  admin labels added: {list(admin_labels.keys())}")
