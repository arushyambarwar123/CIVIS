"""Configuration (rules) API router — reads and writes JSON config files."""
import json
import os
from fastapi import APIRouter, HTTPException
from typing import Any

router = APIRouter(tags=["Configuration"])

CONFIG_DIR = os.path.join(os.path.dirname(__file__), "..", "config")
VALID_RULE_SETS = ["risk_rules", "attendance_rules", "evidence_rules", "matching_rules", "inspection_rules"]


def config_path(rule_set: str) -> str:
    return os.path.join(CONFIG_DIR, f"{rule_set}.json")


@router.get("/config/{rule_set}")
def get_config(rule_set: str):
    if rule_set not in VALID_RULE_SETS:
        raise HTTPException(status_code=404, detail=f"Unknown rule set. Valid: {VALID_RULE_SETS}")
    path = config_path(rule_set)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Config file not found")
    with open(path) as f:
        return json.load(f)


@router.put("/config/{rule_set}")
def update_config(rule_set: str, data: Any):
    if rule_set not in VALID_RULE_SETS:
        raise HTTPException(status_code=404, detail=f"Unknown rule set. Valid: {VALID_RULE_SETS}")
    path = config_path(rule_set)
    with open(path, "w") as f:
        json.dump(data, f, indent=2)
    return {"status": "saved", "rule_set": rule_set}


@router.get("/config")
def list_configs():
    result = {}
    for rs in VALID_RULE_SETS:
        path = config_path(rs)
        if os.path.exists(path):
            with open(path) as f:
                result[rs] = json.load(f)
    return result
