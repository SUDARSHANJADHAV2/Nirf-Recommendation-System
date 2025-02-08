import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.preprocessing import StandardScaler
import logging

class NIRFDataPreprocessor:
    def __init__(self):
        """Initialize the NIRF Data Preprocessor"""
        self.logger = logging.getLogger(__name__)
        self.scaler = StandardScaler()
        
    def load_data(self, file_path):
        """
        Load and perform initial preprocessing of NIRF dataset.
        
        Parameters:
        -----------
        file_path : str or Path
            Path to the input Excel file
            
        Returns:
        --------
        pandas.DataFrame : Preprocessed dataset
        """
        try:
            # Load the dataset
            df = pd.read_excel(file_path)
            
            # Basic data cleaning
            df = self._clean_data(df)
            
            # Handle missing values
            df = self._handle_missing_values(df)
            
            # Process numerical columns
            df = self._process_numerical_columns(df)
            
            return df
            
        except Exception as e:
            self.logger.error(f"Error loading data: {str(e)}")
            raise
    
    def _clean_data(self, df):
        """
        Perform basic data cleaning operations.
        
        Parameters:
        -----------
        df : pandas.DataFrame
            Input dataframe
            
        Returns:
        --------
        pandas.DataFrame : Cleaned dataframe
        """
        # Remove any duplicate rows
        df = df.drop_duplicates()
        
        # Strip whitespace from string columns
        string_columns = df.select_dtypes(include=['object']).columns
        for col in string_columns:
            df[col] = df[col].str.strip()
        
        # Remove any rows where all main parameter columns are missing
        main_params = ['TLR(100)', 'RPC(100)', 'GO(100)', 'OI(100)', 'Perception(100)']
        df = df.dropna(subset=main_params, how='all')
        
        return df
    
    def _handle_missing_values(self, df):
        """
        Handle missing values in the dataset.
        
        Parameters:
        -----------
        df : pandas.DataFrame
            Input dataframe
            
        Returns:
        --------
        pandas.DataFrame : Dataframe with handled missing values
        """
        # For numerical columns, fill missing values with median
        numerical_columns = df.select_dtypes(include=['float64', 'int64']).columns
        for col in numerical_columns:
            median_value = df[col].median()
            df[col] = df[col].fillna(median_value)
        
        # For categorical columns, fill missing values with mode
        categorical_columns = df.select_dtypes(include=['object']).columns
        for col in categorical_columns:
            mode_value = df[col].mode()[0]
            df[col] = df[col].fillna(mode_value)
        
        return df
    
    def _process_numerical_columns(self, df):
        """
        Process numerical columns including scaling where appropriate.
        
        Parameters:
        -----------
        df : pandas.DataFrame
            Input dataframe
            
        Returns:
        --------
        pandas.DataFrame : Processed dataframe
        """
        # Identify columns to scale (excluding Ranking and certain IDs)
        columns_to_scale = [
            col for col in df.select_dtypes(include=['float64', 'int64']).columns
            if col not in ['Ranking', 'Institute ID'] and 'ID' not in col
        ]
        
        # Scale the selected columns
        if columns_to_scale:
            df[columns_to_scale] = self.scaler.fit_transform(df[columns_to_scale])
        
        return df
    
    def save_processed_data(self, df, output_path):
        """
        Save the processed dataset.
        
        Parameters:
        -----------
        df : pandas.DataFrame
            Processed dataframe
        output_path : str or Path
            Path where to save the processed data
        """
        try:
            output_path = Path(output_path)
            output_path.parent.mkdir(parents=True, exist_ok=True)
            
            df.to_csv(output_path, index=False)
            self.logger.info(f"Processed data saved to {output_path}")
            
        except Exception as e:
            self.logger.error(f"Error saving processed data: {str(e)}")
            raise
    
    def get_preprocessing_summary(self, df_original, df_processed):
        """
        Generate a summary of preprocessing operations.
        
        Parameters:
        -----------
        df_original : pandas.DataFrame
            Original dataframe
        df_processed : pandas.DataFrame
            Processed dataframe
            
        Returns:
        --------
        dict : Preprocessing summary statistics
        """
        return {
            'original_shape': df_original.shape,
            'processed_shape': df_processed.shape,
            'dropped_rows': df_original.shape[0] - df_processed.shape[0],
            'missing_values_original': df_original.isnull().sum().to_dict(),
            'missing_values_processed': df_processed.isnull().sum().to_dict(),
            'numerical_columns': list(df_processed.select_dtypes(
                include=['float64', 'int64']).columns),
            'categorical_columns': list(df_processed.select_dtypes(
                include=['object']).columns)
        }