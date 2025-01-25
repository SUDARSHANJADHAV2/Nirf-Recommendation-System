from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from ...models.institution import Institution, InstitutionUpdate
from ...db.mongodb import db

router = APIRouter()

@router.post("/", response_model=Institution)
async def create_institution(institution: Institution):
    """Create a new institution with NIRF parameters and metadata."""
    try:
        existing = await db.db.institutions.find_one({"institute_id": institution.institute_id})
        if existing:
            raise HTTPException(status_code=400, detail="Institution with this ID already exists")
        
        institution_dict = institution.model_dump()
        await db.db.institutions.insert_one(institution_dict)
        return institution_dict
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/all", response_model=List[Institution])
async def list_institutions(skip: int = 0, limit: int = 10):
    """Retrieve a list of all institutions with pagination."""
    institutions = await db.db.institutions.find().skip(skip).limit(limit).to_list(length=limit)
    return institutions

@router.get("/{institute_id}", response_model=Institution)
async def get_institution(institute_id: str):
    """Retrieve detailed information about a specific institution."""
    institution = await db.db.institutions.find_one({"institute_id": institute_id})
    if not institution:
        raise HTTPException(status_code=404, detail="Institution not found")
    return institution

@router.put("/{institute_id}", response_model=Institution)
async def update_institution(institute_id: str, updates: InstitutionUpdate):
    """Update an institution's information and NIRF parameters."""
    institution = await db.db.institutions.find_one({"institute_id": institute_id})
    if not institution:
        raise HTTPException(status_code=404, detail="Institution not found")
    
    update_data = updates.model_dump(exclude_unset=True)
    if update_data:
        await db.db.institutions.update_one(
            {"institute_id": institute_id},
            {"$set": update_data}
        )
    
    updated_institution = await db.db.institutions.find_one({"institute_id": institute_id})
    return updated_institution