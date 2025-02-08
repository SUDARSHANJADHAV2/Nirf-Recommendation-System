import pandas as pd
import numpy as np
import joblib
from pathlib import Path

class NIRFPredictor:
    def __init__(self, model_path):
        self.model = self.load_model(model_path)
        
    @staticmethod
    def load_model(model_path):
        """Load the trained model from disk"""
        return joblib.load(model_path)
    
    def predict_ranking(self, input_data):
        """Predict NIRF ranking for new input data"""
        predictions = self.model.predict(input_data)
        return predictions
    
    def predict_with_confidence(self, input_data):
        """Predict rankings with confidence intervals"""
        # Get predictions from all models in ensemble
        predictions = []
        for _, model in self.model.estimators_:
            pred = model.predict(input_data)
            predictions.append(pred)
        
        # Calculate mean and standard deviation
        predictions = np.array(predictions)
        mean_pred = np.mean(predictions, axis=0)
        std_pred = np.std(predictions, axis=0)
        
        # Calculate confidence intervals (95%)
        confidence_interval = 1.96 * std_pred
        
        return {
            'predictions': mean_pred,
            'lower_bound': mean_pred - confidence_interval,
            'upper_bound': mean_pred + confidence_interval,
            'confidence': 1 - std_pred/mean_pred  # Confidence score
        }
    
    def analyze_prediction(self, input_data, actual_ranking=None):
        """Analyze prediction and provide insights"""
        prediction_results = self.predict_with_confidence(input_data)
        
        analysis = {
            'predicted_ranking': prediction_results['predictions'],
            'confidence_interval': (
                prediction_results['lower_bound'],
                prediction_results['upper_bound']
            ),
            'prediction_confidence': prediction_results['confidence']
        }
        
        if actual_ranking is not None:
            analysis['actual_ranking'] = actual_ranking
            analysis['prediction_error'] = abs(
                prediction_results['predictions'] - actual_ranking
            )
        
        return analysis