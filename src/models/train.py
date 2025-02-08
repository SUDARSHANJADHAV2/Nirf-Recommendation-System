import numpy as np
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error, explained_variance_score
import joblib
import xgboost as xgb
import lightgbm as lgb
from sklearn.model_selection import cross_val_score
import pandas as pd

class NIRFRankingModel:
    def __init__(self, model_type='xgboost'):
        """Initialize the NIRF Ranking Model"""
        self.model_type = model_type
        self.model = self._initialize_model()
        self.feature_importance_ = None
        self.is_fitted = False
        
    def _initialize_model(self):
        """Initialize the selected machine learning model"""
        if self.model_type == 'xgboost':
            return xgb.XGBRegressor(
                n_estimators=1000,
                learning_rate=0.01,
                max_depth=6,
                min_child_weight=1,
                subsample=0.8,
                colsample_bytree=0.8,
                random_state=42,
                n_jobs=-1
            )
        elif self.model_type == 'lightgbm':
            return lgb.LGBMRegressor(
                n_estimators=1000,
                learning_rate=0.01,
                num_leaves=31,
                random_state=42,
                n_jobs=-1
            )
        elif self.model_type == 'gradient_boosting':
            return GradientBoostingRegressor(
                n_estimators=1000,
                learning_rate=0.01,
                max_depth=6,
                random_state=42
            )
        else:
            raise ValueError(f"Unsupported model type: {self.model_type}")
    
    def train(self, X_train, y_train):
        """Train the model on the provided data"""
        print(f"Training {self.model_type} model...")
        self.model.fit(X_train, y_train)
        self.is_fitted = True
        self.feature_importance_ = self.model.feature_importances_
        
    def predict(self, X):
        """Make predictions using the trained model"""
        if not self.is_fitted:
            raise RuntimeError("Model must be trained before making predictions.")
        return self.model.predict(X)
    
    def evaluate(self, X_test, y_test):
        """Evaluate model performance on test data"""
        if not self.is_fitted:
            raise RuntimeError("Model must be trained before evaluation.")
            
        predictions = self.predict(X_test)
        
        metrics = {
            'mse': mean_squared_error(y_test, predictions),
            'rmse': np.sqrt(mean_squared_error(y_test, predictions)),
            'r2': r2_score(y_test, predictions),
            'mae': mean_absolute_error(y_test, predictions),
            'explained_variance': explained_variance_score(y_test, predictions)
        }
        
        return metrics
    
    def get_feature_importance(self, feature_names):
        """Get feature importance scores"""
        if not self.is_fitted:
            raise RuntimeError("Model must be trained before getting feature importance.")
            
        if self.feature_importance_ is None:
            raise RuntimeError("Feature importance not available.")
            
        return dict(zip(feature_names, self.feature_importance_))
    
    def save_model(self, path):
        """Save the trained model to disk"""
        if not self.is_fitted:
            raise RuntimeError("Cannot save untrained model.")
            
        model_data = {
            'model': self.model,
            'model_type': self.model_type,
            'feature_importance': self.feature_importance_,
            'is_fitted': self.is_fitted
        }
        
        joblib.dump(model_data, path)
        print(f"Model saved successfully to {path}")
    
    def load_model(self, path):
        """Load a trained model from disk"""
        try:
            model_data = joblib.load(path)
            self.model = model_data['model']
            self.model_type = model_data['model_type']
            self.feature_importance_ = model_data['feature_importance']
            self.is_fitted = model_data['is_fitted']
            print(f"Model loaded successfully from {path}")
        except Exception as e:
            raise RuntimeError(f"Error loading model: {str(e)}")