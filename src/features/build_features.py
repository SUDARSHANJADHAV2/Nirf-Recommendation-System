import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, PolynomialFeatures
import logging
from typing import Dict, List, Optional, Tuple

class NIRFFeatureBuilder:
    def __init__(self):
        """Initialize the NIRF Feature Builder"""
        self.logger = logging.getLogger(__name__)
        self.scaler = StandardScaler()
        self.poly_features = PolynomialFeatures(degree=2, include_bias=False)
        
        # Define feature groups
        self.feature_groups = {
            'TLR': ['TLR_SS_NT', 'TLR_SS_NE', 'TLR_SS_NP', 'TLR_FSR_F', 
                   'TLR_FQE_FRA', 'TLR_FQE_F1', 'TLR_FQE_F2', 'TLR_FQE_F3'],
            'RPC': ['RP_PU_P', 'RP_PU_FRQ', 'RP_QP_CC', 'RP_QP_TOP25P', 
                   'RP_QP_FRQ', 'RP_IPR_PG', 'RP_IPR_PP'],
            'GO': ['GO_GPH_Np', 'GO_GPH_Nhs', 'GO_GUE_Ng', 'GO_GMS_MS', 
                  'GO_GPHD_Nphd'],
            'OI': ['OI_RD_Students', 'OI_RD_FractionOtherStates', 
                  'OI_RD_FractionOtherCountries', 'OI_WD_NWS', 'OI_WD_NWF']
        }

    def build_all_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Build all features for the NIRF dataset.
        
        Parameters:
        -----------
        df : pandas.DataFrame
            Input dataframe
            
        Returns:
        --------
        pandas.DataFrame : DataFrame with engineered features
        """
        try:
            self.logger.info("Starting feature engineering process...")
            
            # Create copy of dataframe to avoid modifying original
            features_df = df.copy()
            
            # Build basic features
            features_df = self._build_basic_features(features_df)
            
            # Build advanced features
            features_df = self._build_advanced_features(features_df)
            
            # Build interaction features
            features_df = self._build_interaction_features(features_df)
            
            # Build ratio features
            features_df = self._build_ratio_features(features_df)
            
            # Scale numerical features
            features_df = self._scale_features(features_df)
            
            self.logger.info("Feature engineering completed successfully")
            return features_df
            
        except Exception as e:
            self.logger.error(f"Error in feature engineering: {str(e)}")
            raise

    def _build_basic_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Build basic aggregated features"""
        # Create category aggregates
        for category, features in self.feature_groups.items():
            valid_features = [f for f in features if f in df.columns]
            if valid_features:
                df[f'{category}_AGG'] = df[valid_features].mean(axis=1)
        
        # Calculate overall performance score
        main_params = ['TLR(100)', 'RPC(100)', 'GO(100)', 'OI(100)', 
                      'Perception(100)']
        df['Overall_Score'] = df[main_params].mean(axis=1)
        
        return df

    def _build_advanced_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Build advanced statistical features"""
        # Category-specific advanced features
        df = self._build_tlr_features(df)
        df = self._build_rpc_features(df)
        df = self._build_go_features(df)
        df = self._build_oi_features(df)
        
        return df

    def _build_tlr_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Build Teaching Learning Resources specific features"""
        tlr_features = self.feature_groups['TLR']
        valid_features = [f for f in tlr_features if f in df.columns]
        
        if valid_features:
            # Calculate faculty quality score
            faculty_features = [f for f in valid_features if 'FQE' in f]
            if faculty_features:
                df['TLR_Faculty_Quality'] = df[faculty_features].mean(axis=1)
            
            # Calculate student strength score
            student_features = [f for f in valid_features if 'SS' in f]
            if student_features:
                df['TLR_Student_Strength'] = df[student_features].mean(axis=1)
        
        return df

    def _build_rpc_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Build Research and Professional Practice specific features"""
        rpc_features = self.feature_groups['RPC']
        valid_features = [f for f in rpc_features if f in df.columns]
        
        if valid_features:
            # Calculate publication impact score
            pub_features = [f for f in valid_features if 'PU' in f]
            if pub_features:
                df['RPC_Publication_Impact'] = df[pub_features].mean(axis=1)
            
            # Calculate quality perception score
            quality_features = [f for f in valid_features if 'QP' in f]
            if quality_features:
                df['RPC_Quality_Score'] = df[quality_features].mean(axis=1)
        
        return df

    def _build_go_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Build Graduation Outcome specific features"""
        go_features = self.feature_groups['GO']
        valid_features = [f for f in go_features if f in df.columns]
        
        if valid_features:
            # Calculate graduation performance score
            grad_features = [f for f in valid_features if 'GPH' in f]
            if grad_features:
                df['GO_Graduation_Performance'] = df[grad_features].mean(axis=1)
            
            # Calculate university examination score
            exam_features = [f for f in valid_features if 'GUE' in f]
            if exam_features:
                df['GO_Exam_Performance'] = df[exam_features].mean(axis=1)
        
        return df

    def _build_oi_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Build Outreach and Inclusivity specific features"""
        oi_features = self.feature_groups['OI']
        valid_features = [f for f in oi_features if f in df.columns]
        
        if valid_features:
            # Calculate regional diversity score
            region_features = [f for f in valid_features if 'RD' in f]
            if region_features:
                df['OI_Regional_Diversity'] = df[region_features].mean(axis=1)
            
            # Calculate women diversity score
            women_features = [f for f in valid_features if 'WD' in f]
            if women_features:
                df['OI_Women_Diversity'] = df[women_features].mean(axis=1)
        
        return df

    def _build_interaction_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Build interaction features between main parameters"""
        main_params = ['TLR(100)', 'RPC(100)', 'GO(100)', 'OI(100)', 
                      'Perception(100)']
        
        # Create pairwise interactions
        for i in range(len(main_params)):
            for j in range(i+1, len(main_params)):
                param1 = main_params[i].split('(')[0]
                param2 = main_params[j].split('(')[0]
                interaction_name = f'INT_{param1}_{param2}'
                df[interaction_name] = df[main_params[i]] * df[main_params[j]]
        
        return df

    def _build_ratio_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Build ratio features"""
        # Calculate important ratios
        df['RATIO_RPC_TLR'] = df['RPC(100)'] / (df['TLR(100)'] + 1e-6)
        df['RATIO_GO_TLR'] = df['GO(100)'] / (df['TLR(100)'] + 1e-6)
        df['RATIO_P_TOTAL'] = df['Perception(100)'] / (
            df[['TLR(100)', 'RPC(100)', 'GO(100)', 'OI(100)']].mean(axis=1) + 1e-6
        )
        
        return df

    def _scale_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Scale numerical features"""
        # Identify numerical columns to scale
        numerical_cols = df.select_dtypes(include=['float64', 'int64']).columns
        cols_to_scale = [col for col in numerical_cols 
                        if col not in ['Ranking', 'Institute ID']]
        
        if cols_to_scale:
            df[cols_to_scale] = self.scaler.fit_transform(df[cols_to_scale])
        
        return df

    def get_feature_info(self) -> Dict[str, List[str]]:
        """Get information about generated features"""
        return {
            'basic_features': self.feature_groups,
            'interaction_features': ['INT_TLR_RPC', 'INT_TLR_GO', 'INT_TLR_OI', 
                                   'INT_RPC_GO', 'INT_RPC_OI', 'INT_GO_OI'],
            'ratio_features': ['RATIO_RPC_TLR', 'RATIO_GO_TLR', 'RATIO_P_TOTAL']
        }