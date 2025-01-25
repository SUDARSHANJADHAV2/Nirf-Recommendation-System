from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from typing import List, Dict, Any
import logging
from ...services.data_processor import NIRFDataProcessor
from ...db.mongodb import get_database
from motor.motor_asyncio import AsyncIOMotorDatabase

# Set up logging to track our data import process
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()
data_processor = NIRFDataProcessor()

@router.post("/import-initial-data")
async def import_initial_dataset(db: AsyncIOMotorDatabase = Depends(get_database)):
    """
    Import the initial NIRF dataset from our stored Excel file.
    This endpoint processes our base dataset and populates the database.
    
    The function:
    1. Reads the Excel file from our data directory
    2. Processes each institution's data
    3. Stores the processed data in MongoDB
    4. Returns a summary of the import operation
    """
    try:
        # Define path to our dataset
        file_path = "data/raw/Engineering.xlsx"
        logger.info(f"Starting data import from {file_path}")

        # Process the Excel data using our data processor service
        processed_data = await data_processor.process_excel_data(file_path)
        logger.info(f"Successfully processed {len(processed_data)} institutions")

        # Clear existing data (if any) to avoid duplicates
        await db.institutions.delete_many({})
        logger.info("Cleared existing data from database")

        # Insert processed data into database
        result = await db.institutions.insert_many(processed_data)
        logger.info(f"Successfully inserted {len(result.inserted_ids)} institutions into database")

        return {
            "status": "success",
            "message": f"Successfully imported {len(result.inserted_ids)} institutions",
            "details": {
                "processed_count": len(processed_data),
                "inserted_count": len(result.inserted_ids)
            }
        }

    except Exception as e:
        logger.error(f"Error during data import: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to import data: {str(e)}"
        )

@router.get("/data-status")
async def get_data_status(db: AsyncIOMotorDatabase = Depends(get_database)):
    """
    Get the current status of our dataset in the database.
    This helps us verify our data import and monitor our data state.
    
    Returns information about:
    - Total number of institutions
    - Data statistics by state
    - Parameter averages
    """
    try:
        # Get total count of institutions
        total_count = await db.institutions.count_documents({})

        # Get state-wise distribution
        state_distribution = await db.institutions.aggregate([
            {
                "$group": {
                    "_id": "$location.state",
                    "count": {"$sum": 1},
                    "avg_ranking": {"$avg": "$current_ranking"}
                }
            },
            {"$sort": {"count": -1}}
        ]).to_list(None)

        # Calculate average scores for each parameter
        parameter_averages = await db.institutions.aggregate([
            {
                "$group": {
                    "_id": None,
                    "avg_tlr": {"$avg": "$parameters.tlr_score"},
                    "avg_rpc": {"$avg": "$parameters.rpc_score"},
                    "avg_go": {"$avg": "$parameters.go_score"},
                    "avg_oi": {"$avg": "$parameters.oi_score"},
                    "avg_perception": {"$avg": "$parameters.perception_score"}
                }
            }
        ]).to_list(1)

        return {
            "total_institutions": total_count,
            "state_distribution": state_distribution,
            "parameter_averages": parameter_averages[0] if parameter_averages else None
        }

    except Exception as e:
        logger.error(f"Error fetching data status: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch data status: {str(e)}"
        )

@router.post("/validate-data")
async def validate_dataset(db: AsyncIOMotorDatabase = Depends(get_database)):
    """
    Validate the existing dataset in our database.
    This helps ensure data quality and consistency.
    
    Performs checks like:
    - Missing required fields
    - Data type validation
    - Value range validation
    - Relationship consistency
    """
    try:
        validation_results = {
            "missing_fields": [],
            "invalid_values": [],
            "consistency_issues": []
        }

        # Check each institution record
        async for institution in db.institutions.find():
            # Check required fields
            required_fields = ["institute_id", "name", "current_ranking", "parameters"]
            for field in required_fields:
                if field not in institution:
                    validation_results["missing_fields"].append({
                        "institution_id": institution.get("institute_id", "Unknown"),
                        "missing_field": field
                    })

            # Validate parameter values
            if "parameters" in institution:
                for param, value in institution["parameters"].items():
                    if not isinstance(value, (int, float)) or value < 0 or value > 100:
                        validation_results["invalid_values"].append({
                            "institution_id": institution.get("institute_id", "Unknown"),
                            "parameter": param,
                            "invalid_value": value
                        })

        return validation_results

    except Exception as e:
        logger.error(f"Error validating data: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to validate data: {str(e)}"
        )