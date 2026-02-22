import uuid
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict
from app.models.schemas import Person as PersonSchema, PersonCreate, MemoryCreate, Memory as MemorySchema
from app.core.database import db

router = APIRouter()

@router.get("/{person_id}", response_model=Dict)
async def get_person(person_id: str):
    if not db.pool:
        raise HTTPException(status_code=503, detail="Database unavailable")
    try:
        async with db.pool.acquire() as conn:
            row = await conn.fetchrow("SELECT * FROM persons WHERE id = $1", uuid.UUID(person_id))
            if not row:
                raise HTTPException(status_code=404, detail="Person not found")
            memories = await conn.fetch(
                "SELECT id, memory_text, emotion, year_reference, decade, themes, importance_score FROM memories WHERE person_id = $1 ORDER BY importance_score DESC",
                uuid.UUID(person_id)
            )
            data = dict(row)
            data["memories"] = [dict(m) for m in memories]
            data["memory_count"] = len(memories)
            return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/create", response_model=Dict)
async def create_person(data: PersonCreate):
    if not db.pool:
        raise HTTPException(status_code=503, detail="Database unavailable")
    try:
        async with db.pool.acquire() as conn:
            row = await conn.fetchrow("""
                INSERT INTO persons (name, birth_year, birth_place, photo_urls)
                VALUES ($1, $2, $3, $4)
                RETURNING id, name, birth_year, birth_place, created_at
            """, data.name, data.birth_year, data.birth_place, data.photo_urls)
            return dict(row)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{person_id}/memories", response_model=Dict)
async def add_memory(person_id: str, memory: MemoryCreate):
    if not db.pool:
        raise HTTPException(status_code=503, detail="Database unavailable")
    try:
        async with db.pool.acquire() as conn:
            row = await conn.fetchrow("""
                INSERT INTO memories (person_id, memory_text, emotion, year_reference, audio_url)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id, memory_text, emotion, year_reference, created_at
            """, uuid.UUID(person_id), memory.memory_text, memory.emotion,
               memory.year_reference, memory.audio_url)
            return dict(row)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
