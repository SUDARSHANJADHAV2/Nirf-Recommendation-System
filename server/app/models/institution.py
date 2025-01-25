from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class NIRFParameters(BaseModel):
    tlr_score: float = Field(..., ge=0, le=100)
    rpc_score: float = Field(..., ge=0, le=100)
    go_score: float = Field(..., ge=0, le=100)
    oi_score: float = Field(..., ge=0, le=100)
    perception_score: float = Field(..., ge=0, le=100)

class Institution(BaseModel):
    institute_id: str = Field(..., description="Unique Institute ID")
    name: str = Field(..., min_length=1)
    city: str
    state: str
    current_ranking: int = Field(..., gt=0)
    parameters: NIRFParameters
    last_updated: datetime = Field(default_factory=datetime.utcnow)
    email: Optional[str] = None

class InstitutionUpdate(BaseModel):
    name: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    email: Optional[str] = None
    parameters: Optional[NIRFParameters] = None