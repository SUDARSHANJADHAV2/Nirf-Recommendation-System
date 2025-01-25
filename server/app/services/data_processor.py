import pandas as pd
from typing import List, Dict, Any
from fastapi import HTTPException
import logging

class NIRFDataProcessor:
    """
    Service class for processing NIRF dataset and preparing it for database storage.
    This class handles all data transformation and validation operations.
    """
    
    def __init__(self):
        # Initialize logger for tracking data processing
        self.logger = logging.getLogger(__name__)
        
        # Define expected columns based on NIRF parameters
        self.required_columns = {
            'Institute ID', 'Institute Name', 'City', 'State',
            'TLR(100)', 'RPC(100)', 'GO(100)', 'OI(100)', 'Perception(100)',
            'Score', 'Ranking'
        }
        
        # Define detailed parameter columns
        self.tlr_columns = {
            'TLR_SS_NT', 'TLR_SS_NE', 'TLR_SS_NP',
            'TLR_FSR_F', 'TLR_FQE_FRA', 'TLR_FQE_F1',
            'TLR_FQE_F2', 'TLR_FQE_F3', 'TLR_FRU_BC',
            'TLR_FRU_BO'
        }
        
        self.rpc_columns = {
            'RP_PU_P', 'RP_PU_FRQ', 'RP_QP_CC',
            'RP_QP_TOP25P', 'RP_QP_FRQ', 'RP_IPR_PG',
            'RP_IPR_PP', 'RP_FPPP_RF', 'RP_FPPP_CF'
        }

    async def process_excel_data(self, file_path: str) -> List[Dict[str, Any]]:
        """
        Process the NIRF Excel dataset and transform it into our database format.
        
        Args:
            file_path: Path to the Excel file containing NIRF data
            
        Returns:
            List of processed institution records ready for database insertion
        """
        try:
            # Read Excel file
            df = pd.read_excel(file_path)
            
            # Validate columns
            self._validate_columns(df)
            
            # Process each institution
            processed_data = []
            for _, row in df.iterrows():
                processed_record = self._process_institution_record(row)
                processed_data.append(processed_record)
                
            self.logger.info(f"Successfully processed {len(processed_data)} institutions")
            return processed_data
            
        except Exception as e:
            self.logger.error(f"Error processing Excel data: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Error processing Excel data: {str(e)}"
            )

    def _validate_columns(self, df: pd.DataFrame) -> None:
        """
        Validate that all required columns are present in the dataset.
        """
        missing_columns = self.required_columns - set(df.columns)
        if missing_columns:
            raise ValueError(f"Missing required columns: {missing_columns}")

    def _process_institution_record(self, row: pd.Series) -> Dict[str, Any]:
        """
        Transform a single institution record into our database format.
        
        This method handles the complex transformation of raw NIRF data
        into our structured format, including detailed parameter calculations.
        """
        return {
            "institute_id": str(row['Institute ID']),
            "name": str(row['Institute Name']),
            "location": {
                "city": str(row['City']),
                "state": str(row['State'])
            },
            "current_ranking": int(row['Ranking']),
            "parameters": {
                "tlr_score": float(row['TLR(100)']),
                "rpc_score": float(row['RPC(100)']),
                "go_score": float(row['GO(100)']),
                "oi_score": float(row['OI(100)']),
                "perception_score": float(row['Perception(100)'])
            },
            "detailed_metrics": {
                "tlr": self._process_tlr_metrics(row),
                "rpc": self._process_rpc_metrics(row)
            },
            "overall_score": float(row['Score'])
        }

    def _process_tlr_metrics(self, row: pd.Series) -> Dict[str, Any]:
        """
        Process detailed Teaching Learning & Resources metrics.
        """
        return {
            "student_strength": {
                "total_students": float(row['TLR_SS_NT']),
                "enrolled_students": float(row['TLR_SS_NE']),
                "doctoral_students": float(row['TLR_SS_NP'])
            },
            "faculty_ratio": float(row['TLR_FSR_F']),
            "faculty_qualification": {
                "phd_percentage": float(row['TLR_FQE_FRA']),
                "experience_dist": {
                    "upto_8yrs": float(row['TLR_FQE_F1']),
                    "upto_15yrs": float(row['TLR_FQE_F2']),
                    "above_15yrs": float(row['TLR_FQE_F3'])
                }
            },
            "financial_resources": {
                "capital_expenditure": float(row['TLR_FRU_BC']),
                "operational_expenditure": float(row['TLR_FRU_BO'])
            }
        }

    def _process_rpc_metrics(self, row: pd.Series) -> Dict[str, Any]:
        """
        Process detailed Research & Professional Practice metrics.
        """
        return {
            "publications": {
                "count": float(row['RP_PU_P']),
                "quality_publications": float(row['RP_QP_CC']),
                "top_25_percent": float(row['RP_QP_TOP25P'])
            },
            "patents": {
                "granted": float(row['RP_IPR_PG']),
                "published": float(row['RP_IPR_PP'])
            },
            "funding": {
                "research": float(row['RP_FPPP_RF']),
                "consultancy": float(row['RP_FPPP_CF'])
            }
        }