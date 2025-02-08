import pandas as pd
import numpy as np
import logging
from typing import Dict, List, Any

class NIRFDataValidator:
    def __init__(self):
        """Initialize the NIRF Data Validator"""
        self.logger = logging.getLogger(__name__)
        
        # Define required columns and their expected data types
        self.required_columns = {
            'Institute ID': str,
            'Institute Name': str,
            'TLR(100)': float,
            'RPC(100)': float,
            'GO(100)': float,
            'OI(100)': float,
            'Perception(100)': float,
            'Score': float,
            'Ranking': float
        }
        
        # Define expected value ranges for parameters
        self.value_ranges = {
            'TLR(100)': (0, 100),
            'RPC(100)': (0, 100),
            'GO(100)': (0, 100),
            'OI(100)': (0, 100),
            'Perception(100)': (0, 100),
            'Score': (0, 100)
        }

    def validate_dataset(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Perform comprehensive validation of the NIRF dataset.
        
        Parameters:
        -----------
        df : pandas.DataFrame
            Dataset to validate
            
        Returns:
        --------
        dict : Validation results including status and any issues found
        """
        validation_results = {
            'status': 'passed',
            'issues': []
        }

        # Check data structure
        structure_issues = self._validate_structure(df)
        if structure_issues:
            validation_results['status'] = 'failed'
            validation_results['issues'].extend(structure_issues)

        # Check data types
        type_issues = self._validate_data_types(df)
        if type_issues:
            validation_results['status'] = 'warning'
            validation_results['issues'].extend(type_issues)

        # Check value ranges
        range_issues = self._validate_value_ranges(df)
        if range_issues:
            validation_results['status'] = 'warning'
            validation_results['issues'].extend(range_issues)

        # Check for duplicates
        duplicate_issues = self._check_duplicates(df)
        if duplicate_issues:
            validation_results['status'] = 'warning'
            validation_results['issues'].extend(duplicate_issues)

        return validation_results

    def _validate_structure(self, df: pd.DataFrame) -> List[str]:
        """Validate the basic structure of the dataframe"""
        issues = []
        
        # Check for required columns
        missing_columns = [col for col in self.required_columns 
                         if col not in df.columns]
        if missing_columns:
            issues.append(f"Missing required columns: {missing_columns}")

        # Check for empty dataset
        if df.empty:
            issues.append("Dataset is empty")

        return issues

    def _validate_data_types(self, df: pd.DataFrame) -> List[str]:
        """Validate data types of columns"""
        issues = []
        
        for column, expected_type in self.required_columns.items():
            if column not in df.columns:
                continue
                
            if expected_type == float:
                non_numeric = df[~pd.to_numeric(df[column], errors='coerce').notna()]
                if not non_numeric.empty:
                    issues.append(
                        f"Column {column} contains non-numeric values at "
                        f"indices: {list(non_numeric.index)}"
                    )
            
            elif expected_type == str:
                non_string = df[~df[column].apply(lambda x: isinstance(x, str))]
                if not non_string.empty:
                    issues.append(
                        f"Column {column} contains non-string values at "
                        f"indices: {list(non_string.index)}"
                    )

        return issues

    def _validate_value_ranges(self, df: pd.DataFrame) -> List[str]:
        """Validate that values are within expected ranges"""
        issues = []
        
        for column, (min_val, max_val) in self.value_ranges.items():
            if column not in df.columns:
                continue
                
            out_of_range = df[
                (df[column] < min_val) | (df[column] > max_val)
            ]
            
            if not out_of_range.empty:
                issues.append(
                    f"Column {column} contains values outside the expected "
                    f"range [{min_val}, {max_val}] at indices: "
                    f"{list(out_of_range.index)}"
                )

        return issues

    def _check_duplicates(self, df: pd.DataFrame) -> List[str]:
        """Check for duplicate entries"""
        issues = []
        
        # Check for exact duplicates
        exact_duplicates = df[df.duplicated()]
        if not exact_duplicates.empty:
            issues.append(
                f"Found {len(exact_duplicates)} exact duplicate rows at "
                f"indices: {list(exact_duplicates.index)}"
            )

        # Check for duplicate Institute IDs
        id_duplicates = df[df['Institute ID'].duplicated()]
        if not id_duplicates.empty:
            issues.append(
                f"Found {len(id_duplicates)} duplicate Institute IDs at "
                f"indices: {list(id_duplicates.index)}"
            )

        return issues

    def generate_validation_report(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Generate a comprehensive validation report.
        
        Parameters:
        -----------
        df : pandas.DataFrame
            Dataset to validate
            
        Returns:
        --------
        dict : Detailed validation report
        """
        validation_results = self.validate_dataset(df)
        
        report = {
            'validation_status': validation_results['status'],
            'issues': validation_results['issues'],
            'data_summary': {
                'total_rows': len(df),
                'total_columns': len(df.columns),
                'missing_values': df.isnull().sum().to_dict(),
                'column_dtypes': df.dtypes.astype(str).to_dict()
            },
            'value_statistics': {}
        }
        
        # Add statistics for numerical columns
        for column in self.value_ranges.keys():
            if column in df.columns:
                report['value_statistics'][column] = {
                    'mean': float(df[column].mean()),
                    'std': float(df[column].std()),
                    'min': float(df[column].min()),
                    'max': float(df[column].max()),
                    'median': float(df[column].median())
                }
        
        return report