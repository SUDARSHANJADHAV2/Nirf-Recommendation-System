import numpy as np
from xgboost import XGBRegressor
from sklearn.ensemble import VotingRegressor
from sklearn.metrics import mean_squared_error, r2_score
import joblib

class EnhancedNIRFModel:
    def __init__(self):
        self.model = None
        self.feature_importance_ = None
        
    def create_base_models(self):
        # Create three XGBoost models with different configurations
        xgb1 = XGBRegressor(
            n_estimators=100,
            learning_rate=0.1,
            max_depth=4,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42
        )
        
        xgb2 = XGBRegressor(
            n_estimators=100,
            learning_rate=0.05,
            max_depth=5,
            subsample=0.9,
            colsample_bytree=0.9,
            random_state=43
        )
        
        xgb3 = XGBRegressor(
            n_estimators=100,
            learning_rate=0.08,
            max_depth=3,
            subsample=0.85,
            colsample_bytree=0.85,
            random_state=44
        )
        
        return [('xgb1', xgb1), ('xgb2', xgb2), ('xgb3', xgb3)]

    def train(self, X_train, y_train):
        print("Creating ensemble model...")
        # Create and train base models
        base_models = self.create_base_models()
        
        # Train each base model
        trained_models = []
        for name, model in base_models:
            print(f"Training {name}...")
            model.fit(X_train, y_train)
            trained_models.append((name, model))
        
        # Create and train ensemble
        print("Training ensemble...")
        self.model = VotingRegressor(
            estimators=trained_models,
            weights=[1] * len(trained_models)
        )
        self.model.fit(X_train, y_train)
        
        # Store feature importance from first base model
        self.feature_importance_ = trained_models[0][1].feature_importances_
        print("Training completed!")
    
    def predict(self, X):
        return self.model.predict(X)
    
    def evaluate(self, X_test, y_test):
        predictions = self.predict(X_test)
        mse = mean_squared_error(y_test, predictions)
        r2 = r2_score(y_test, predictions)
        
        return {
            'mse': mse,
            'rmse': np.sqrt(mse),
            'r2': r2
        }
    
    def get_feature_importance(self, feature_names):
        return dict(zip(feature_names, self.feature_importance_))
    
    def save_model(self, path):
        joblib.dump(self.model, path)
    
    def load_model(self, path):
        self.model = joblib.load(path)