import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, PolynomialFeatures

class NIRFFeatureEngineer:
    def __init__(self):
        self.scaler = StandardScaler()
        self.poly = PolynomialFeatures(degree=2, include_bias=False)
        
    def create_category_aggregates(self, df):
        """Create aggregate features for each main category"""
        # TLR aggregates
        df['TLR_SS_AGG'] = df[['TLR_SS_NT', 'TLR_SS_NE', 'TLR_SS_NP']].mean(axis=1)
        df['TLR_FQE_AGG'] = df[['TLR_FQE_FRA', 'TLR_FQE_F1', 'TLR_FQE_F2', 'TLR_FQE_F3']].mean(axis=1)
        
        # RPC aggregates
        df['RP_PU_AGG'] = df[['RP_PU_P', 'RP_PU_FRQ']].mean(axis=1)
        df['RP_QP_AGG'] = df[['RP_QP_CC', 'RP_QP_TOP25P', 'RP_QP_FRQ']].mean(axis=1)
        
        # GO aggregates
        df['GO_GPH_AGG'] = df[['GO_GPH_Np', 'GO_GPH_Nhs']].mean(axis=1)
        
        # OI aggregates
        df['OI_RD_AGG'] = df[['OI_RD_FractionOtherStates', 'OI_RD_FractionOtherCountries']].mean(axis=1)
        df['OI_WD_AGG'] = df[['OI_WD_NWS', 'OI_WD_NWF']].mean(axis=1)
        
        return df
    
    def create_interaction_features(self, df):
        """Create interaction features between main categories"""
        main_categories = ['TLR(100)', 'RPC(100)', 'GO(100)', 'OI(100)', 'Perception(100)']
        
        # Create interactions between main categories
        for i in range(len(main_categories)):
            for j in range(i+1, len(main_categories)):
                col_name = f"INT_{main_categories[i].split('(')[0]}_{main_categories[j].split('(')[0]}"
                df[col_name] = df[main_categories[i]] * df[main_categories[j]]
        
        return df
    
    def create_ratio_features(self, df):
        """Create ratio features"""
        # Research to Teaching ratio
        df['RATIO_RPC_TLR'] = df['RPC(100)'] / (df['TLR(100)'] + 1e-6)
        
        # Graduation Outcome to Teaching ratio
        df['RATIO_GO_TLR'] = df['GO(100)'] / (df['TLR(100)'] + 1e-6)
        
        # Perception to Overall Performance ratio
        df['RATIO_P_TOTAL'] = df['Perception(100)'] / (df[['TLR(100)', 'RPC(100)', 'GO(100)', 'OI(100)']].mean(axis=1) + 1e-6)
        
        return df
    
    def engineer_features(self, df):
        """Complete feature engineering pipeline"""
        # Create copy to avoid modifying original
        df_engineered = df.copy()
        
        # Apply all feature engineering steps
        df_engineered = self.create_category_aggregates(df_engineered)
        df_engineered = self.create_interaction_features(df_engineered)
        df_engineered = self.create_ratio_features(df_engineered)
        
        # Select numerical columns
        numerical_cols = df_engineered.select_dtypes(include=['float64', 'int64']).columns
        
        # Scale features
        df_engineered[numerical_cols] = self.scaler.fit_transform(df_engineered[numerical_cols])
        
        return df_engineered