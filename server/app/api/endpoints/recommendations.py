from fastapi import APIRouter, HTTPException
from ...models.institution import Institution
from ...services.recommendation_service import RecommendationService
from ...db.mongodb import db

router = APIRouter()
recommendation_service = RecommendationService()

@router.get("/{institute_id}")
async def get_recommendations(institute_id: str):
    """Generate personalized recommendations for improving NIRF ranking."""
    institution = await db.db.institutions.find_one({"institute_id": institute_id})
    if not institution:
        raise HTTPException(status_code=404, detail="Institution not found")

    institution_model = Institution(**institution)
    recommendations = recommendation_service.generate_recommendations(institution_model.parameters)

    return {
        "institution_name": institution["name"],
        "current_ranking": institution["current_ranking"],
        "recommendations": recommendations
    }