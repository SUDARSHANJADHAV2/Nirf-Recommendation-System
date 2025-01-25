import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from typing import List, Dict, Tuple
import joblib
import logging
from datetime import datetime

class NIRFMLService:
    """
    Machine Learning service for NIRF ranking predictions and recommendations.
    This service handles all ML operations including model training, prediction,
    and generating improvement recommendations.
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.scaler = StandardScaler()
        self.model = RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            random_state=42
        )
        
        # Define parameter weights based on NIRF methodology
        self.parameter_weights = {
            'tlr_score': 0.30,
            'rpc_score': 0.30,
            'go_score': 0.20,
            'oi_score': 0.10,
            'perception_score': 0.10
        }
        
        # Initialize feature importance dictionary
        self.feature_importance = {}

    async def train_model(self, institutions_data: List[Dict]) -> None:
        """
        Train the ML model using historical NIRF data.
        
        Args:
            institutions_data: List of institution records from database
        """
        try:
            # Convert data to DataFrame
            df = pd.DataFrame(institutions_data)
            
            # Prepare features
            X = self._prepare_features(df)
            y = df['current_ranking']
            
            # Scale features
            X_scaled = self.scaler.fit_transform(X)
            
            # Train model
            self.model.fit(X_scaled, y)
            
            # Calculate feature importance
            self._calculate_feature_importance(X.columns)
            
            # Save model and scaler
            self._save_model()
            
            self.logger.info("Successfully trained ML model")
            
        except Exception as e:
            self.logger.error(f"Error training model: {str(e)}")
            raise

    def _prepare_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Prepare features for model training.
        
        Args:
            df: DataFrame containing institution data
            
        Returns:
            DataFrame with prepared features
        """
        features = pd.DataFrame()
        
        # Extract parameters
        for param in self.parameter_weights.keys():
            features[param] = df['parameters'].apply(lambda x: x[param])
            
        # Add additional features if available
        if 'detailed_metrics' in df.columns:
            features = self._add_detailed_metrics(df, features)
            
        return features

    def _add_detailed_metrics(self, df: pd.DataFrame, features: pd.DataFrame) -> pd.DataFrame:
        """
        Add detailed metrics as features.
        
        Args:
            df: Original DataFrame
            features: Features DataFrame
            
        Returns:
            Enhanced features DataFrame
        """
        detailed_metrics = [
            'faculty_ratio',
            'phd_percentage',
            'capital_expenditure',
            'operational_expenditure'
        ]
        
        for metric in detailed_metrics:
            try:
                features[f'detailed_{metric}'] = df['detailed_metrics'].apply(
                    lambda x: self._extract_metric(x, metric)
                )
            except Exception as e:
                self.logger.warning(f"Could not extract metric {metric}: {str(e)}")
                
        return features

    def _calculate_feature_importance(self, feature_names: List[str]) -> None:
        """
        Calculate and store feature importance scores.
        """
        importance_scores = self.model.feature_importances_
        self.feature_importance = dict(zip(feature_names, importance_scores))

    def _save_model(self) -> None:
        """
        Save the trained model and scaler.
        """
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        joblib.dump(self.model, f'models/nirf_model_{timestamp}.joblib')
        joblib.dump(self.scaler, f'models/nirf_scaler_{timestamp}.joblib')

    async def predict_ranking(self, institution_data: Dict) -> Dict:
        """
        Predict ranking for an institution based on its parameters.
        
        Args:
            institution_data: Institution data dictionary
            
        Returns:
            Dictionary containing prediction and confidence score
        """
        try:
            # Prepare features
            features = pd.DataFrame([institution_data])
            X = self._prepare_features(features)
            
            # Scale features
            X_scaled = self.scaler.transform(X)
            
            # Make prediction
            prediction = self.model.predict(X_scaled)[0]
            confidence = self._calculate_prediction_confidence(X_scaled)
            
            return {
                "predicted_ranking": int(round(prediction)),
                "confidence_score": float(confidence),
                "prediction_date": datetime.now().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Error making prediction: {str(e)}")
            raise

    def _calculate_prediction_confidence(self, X_scaled: np.ndarray) -> float:
        """
        Calculate confidence score for prediction.
        
        Args:
            X_scaled: Scaled features array
            
        Returns:
            Confidence score between 0 and 1
        """
        # Get predictions from all trees
        predictions = np.array([tree.predict(X_scaled) 
                              for tree in self.model.estimators_])
        
        # Calculate confidence based on variance of predictions
        confidence = 1 / (1 + np.var(predictions))
        return min(confidence, 1.0)

    async def generate_recommendations(self, 
                                    institution_data: Dict,
                                    target_ranking: int) -> List[Dict]:
        """
        Generate recommendations for improving ranking.
        
        Args:
            institution_data: Current institution data
            target_ranking: Desired ranking to achieve
            
        Returns:
            List of recommendations with impact scores
        """
        try:
            current_params = institution_data['parameters']
            recommendations = []
            
            # Analyze each parameter
            for param, current_value in current_params.items():
                # Calculate potential improvement
                improvement_impact = self._calculate_improvement_impact(
                    institution_data,
                    param,
                    current_value
                )
                
                if improvement_impact['impact_score'] > 0:
                    recommendations.append({
                        'parameter': param,
                        'current_value': current_value,
                        'suggested_improvement': improvement_impact['suggested_value'],
                        'impact_score': improvement_impact['impact_score'],
                        'priority': self._calculate_priority(improvement_impact['impact_score']),
                        'actions': self._get_improvement_actions(param)
                    })
            
            # Sort recommendations by impact score
            recommendations.sort(key=lambda x: x['impact_score'], reverse=True)
            
            return recommendations
            
        except Exception as e:
            self.logger.error(f"Error generating recommendations: {str(e)}")
            raise

    def _calculate_improvement_impact(self,
                                   institution_data: Dict,
                                   parameter: str,
                                   current_value: float) -> Dict:
        """
        Calculate the potential impact of improving a parameter.
        
        Args:
            institution_data: Current institution data
            parameter: Parameter to analyze
            current_value: Current parameter value
            
        Returns:
            Dictionary containing impact analysis
        """
        # Create a copy of the institution data
        modified_data = institution_data.copy()
        
        # Try different improvement levels
        improvements = [5, 10, 15, 20]
        best_impact = {'impact_score': 0, 'suggested_value': current_value}
        
        for improvement in improvements:
            new_value = min(current_value + improvement, 100)
            modified_data['parameters'][parameter] = new_value
            
            # Predict new ranking with improvement
            features = pd.DataFrame([modified_data])
            X = self._prepare_features(features)
            X_scaled = self.scaler.transform(X)
            new_ranking = self.model.predict(X_scaled)[0]
            
            # Calculate impact
            ranking_improvement = institution_data['current_ranking'] - new_ranking
            weighted_impact = ranking_improvement * self.parameter_weights[parameter]
            
            if weighted_impact > best_impact['impact_score']:
                best_impact = {
                    'impact_score': weighted_impact,
                    'suggested_value': new_value
                }
        
        return best_impact

    def _calculate_priority(self, impact_score: float) -> str:
        """
        Calculate priority level based on impact score.
        """
        if impact_score > 15:
            return 'High'
        elif impact_score > 8:
            return 'Medium'
        return 'Low'

    def _get_improvement_actions(self, parameter: str) -> List[str]:
        """
        Get specific improvement actions for a parameter.
        """
        action_recommendations = {
            'tlr_score': [
                "Implement faculty development programs",
                "Enhance teaching infrastructure",
                "Develop student mentoring programs"
            ],
            'rpc_score': [
                "Increase research publications",
                "Establish research collaborations",
                "Enhance patent filing activities"
            ],
            'go_score': [
                "Strengthen placement cell",
                "Develop industry partnerships",
                "Enhance alumni network"
            ],
            'oi_score': [
                "Implement inclusive education policies",
                "Enhance infrastructure accessibility",
                "Develop outreach programs"
            ],
            'perception_score': [
                "Improve institutional branding",
                "Organize national events",
                "Enhance media presence"
            ]
        }
        
        return action_recommendations.get(parameter, [])