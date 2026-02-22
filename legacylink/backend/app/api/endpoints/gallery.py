from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict
from app.models.schemas import Person
from app.core.database import db
from app.core.config import settings

router = APIRouter()

DEMO_IDS = {
    "grandma_ruth": "550e8400-e29b-41d4-a716-446655440001",
    "grandpa_joe": "550e8400-e29b-41d4-a716-446655440002",
    "uncle_bob": "550e8400-e29b-41d4-a716-446655440003",
}

@router.get("/", response_model=Dict[str, List[Dict]])
async def get_gallery():
    if not db.pool:
        return {"persons": [
            {"id": DEMO_IDS["grandma_ruth"], "name": "Grandma Ruth", "birth_year": 1947, "birth_place": "Columbus, Ohio", "demo_persona": True, "memory_count": 5},
            {"id": DEMO_IDS["grandpa_joe"], "name": "Grandpa Joe", "birth_year": 1943, "birth_place": "Brooklyn, New York", "demo_persona": True, "memory_count": 3},
            {"id": DEMO_IDS["uncle_bob"], "name": "Uncle Bob", "birth_year": 1960, "birth_place": "Santa Cruz, California", "demo_persona": True, "memory_count": 3},
        ]}

    try:
        async with db.pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT p.id, p.name, p.birth_year, p.birth_place, p.demo_persona,
                       p.avatar_url, p.created_at,
                       COUNT(m.id) as memory_count
                FROM persons p
                LEFT JOIN memories m ON m.person_id = p.id
                GROUP BY p.id
                ORDER BY p.created_at DESC
            """)
            return {"persons": [dict(r) for r in rows]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
