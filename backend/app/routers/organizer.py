"""
Smart Organizer Router - API Endpoints
File: backend/app/routers/organizer.py
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict

router = APIRouter()


class OrganizeRequest(BaseModel):
    items: List[str]
    context: str = ""  # Optional context (e.g., "grocery", "tasks", "books")


class OrganizedResponse(BaseModel):
    categories: Dict[str, List[str]]
    suggestions: List[str] = []


@router.post("/organize")
async def organize_items(request: OrganizeRequest):
    """
    Organize a list of items into categories
    Works for any type of items: groceries, tasks, files, etc.
    """
    # TODO: Implement with Ollama
    return {
        "message": "Organizer endpoint - Coming soon!",
        "items_received": len(request.items)
    }


@router.post("/suggestions")
async def get_suggestions(items: List[str], context: str = ""):
    """Get smart suggestions based on items"""
    # TODO: Implement
    return {
        "suggestions": [],
        "message": "Suggestions endpoint - Coming soon!"
    }