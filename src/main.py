import os
from pathlib import Path
import pandas as pd
import numpy as np
from datetime import datetime
import json
import logging
from sklearn.model_selection import train_test_split
import warnings
import sys
from typing import Dict, Any

from data.preprocess import NIRFDataPreprocessor
from data.validation import NIRFDataValidator
from features.build_features import NIRFFeatureBuilder
from models.train import NIRFRankingModel
from analysis import NIRFAnalyzer
from visualization.visualize import NIRFVisualizer

# Suppress warnings
warnings.filterwarnings('ignore')

class JSONEncoder(json.JSONEncoder):
    """Custom JSON encoder to handle NumPy types"""
    def default(self, obj):
        if isinstance(obj, (np.integer, np.floating, np.bool_)):
            return obj.item()
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        return super().default(obj)

class NIRFRecommendationSystem:
    def __init__(self):
        """Initialize the NIRF Recommendation System"""
        self.setup_logging()
        self.setup_environment()
        self.initialize_components()
        
    def setup_logging(self):
        """Configure logging for the system"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.StreamHandler(),
                logging.FileHandler('nirf_analysis.log')
            ]
        )
        self.logger = logging.getLogger(__name__)

    def setup_environment(self):
        """Set up necessary directories for the analysis"""
        try:
            self.logger.info("Setting up environment...")
            base_dir = Path.cwd()
            directories = ['data/raw', 'data/processed', 'models', 
                         'reports', 'visualizations']
            
            for directory in directories:
                (base_dir / directory).mkdir(parents=True, exist_ok=True)
            
            self.logger.info("Environment setup completed")
        except Exception as e:
            self.logger.error(f"Error setting up environment: {str(e)}")
            raise

    def initialize_components(self):
        """Initialize system components"""
        try:
            self.logger.info("Initializing system components...")
            self.preprocessor = NIRFDataPreprocessor()
            self.validator = NIRFDataValidator()
            self.feature_builder = NIRFFeatureBuilder()
            self.model = NIRFRankingModel(model_type='xgboost')
            self.visualizer = NIRFVisualizer()
            self.logger.info("Components initialized successfully")
        except Exception as e:
            self.logger.error(f"Error initializing components: {str(e)}")
            raise

    def process_data(self, data_path: Path) -> pd.DataFrame:
        """Process and validate input data"""
        try:
            self.logger.info(f"Loading data from {data_path}")
            df = self.preprocessor.load_data(data_path)
            
            self.logger.info("Validating dataset...")
            validation_result = self.validator.validate_dataset(df)
            
            if validation_result['status'] == 'failed':
                raise ValueError(f"Data validation failed: {validation_result['issues']}")
            elif validation_result['status'] == 'warning':
                self.logger.warning("Data validation warnings:")
                for issue in validation_result['issues']:
                    self.logger.warning(f"- {issue}")
            
            return df
        except Exception as e:
            self.logger.error(f"Error processing data: {str(e)}")
            raise

    def engineer_features(self, df: pd.DataFrame) -> tuple:
        """Engineer features for model training"""
        try:
            self.logger.info("Engineering features...")
            features = df.drop(['Institute ID', 'Institute Name', 'City', 'State'], 
                             axis=1)
            
            target = features['Ranking']
            features = features.drop(['Ranking', 'Score'], axis=1)
            
            return features, target
        except Exception as e:
            self.logger.error(f"Error engineering features: {str(e)}")
            raise

    def train_model(self, features: pd.DataFrame, target: pd.Series) -> tuple:
        """Train and evaluate the model"""
        try:
            self.logger.info("Splitting data into train and test sets...")
            X_train, X_test, y_train, y_test = train_test_split(
                features, target,
                test_size=0.2,
                random_state=42
            )
            
            self.logger.info("Training model...")
            self.model.train(X_train, y_train)
            
            self.logger.info("Evaluating model performance...")
            metrics = self.model.evaluate(X_test, y_test)
            
            return X_train, X_test, y_train, y_test, metrics
        except Exception as e:
            self.logger.error(f"Error in model training: {str(e)}")
            raise

    def generate_visualizations(self, df: pd.DataFrame, features: pd.DataFrame, 
                              X_test: pd.DataFrame, y_test: pd.Series, 
                              metrics: Dict[str, float], timestamp: str):
        """Generate all visualizations"""
        try:
            self.logger.info("Generating visualizations...")
            
            # Prepare data for visualization
            visualization_data = {
                'raw_data': df,
                'feature_importance': self.model.get_feature_importance(features.columns),
                'actual_rankings': y_test,
                'predictions': self.model.predict(X_test),
                'metrics': metrics
            }
            
            # Generate visualizations
            self.visualizer.generate_all_visualizations(
                data=visualization_data,
                results={
                    'metrics': metrics,
                    'feature_importance': self.model.get_feature_importance(features.columns),
                    'actual_rankings': y_test,
                    'predictions': self.model.predict(X_test)
                },
                timestamp=timestamp
            )
            
            self.logger.info("Visualizations generated successfully")
        except Exception as e:
            self.logger.error(f"Error generating visualizations: {str(e)}")
            raise

    def save_results(self, metrics: Dict[str, float], 
                    analysis_results: Dict[str, Any], 
                    recommendations: Dict[str, Any],
                    timestamp: str):
        """Save analysis results and model"""
        try:
            # Save model
            model_path = Path('models') / f'nirf_model_{timestamp}.joblib'
            self.model.save_model(model_path)
            
            # Convert metrics to native Python types
            converted_metrics = {
                k: float(v) if isinstance(v, (np.integer, np.floating)) else v
                for k, v in metrics.items()
            }

            # Prepare results dictionary
            results = {
                'timestamp': timestamp,
                'metrics': converted_metrics,
                'analysis': analysis_results,
                'recommendations': recommendations
            }
            
            # Save results using custom JSON encoder
            results_path = Path('reports') / f'analysis_results_{timestamp}.json'
            with open(results_path, 'w') as f:
                json.dump(results, f, cls=JSONEncoder, indent=4)
                
            self.logger.info(f"Results saved to {results_path}")
        except Exception as e:
            self.logger.error(f"Error saving results: {str(e)}")
            raise

    def print_summary(self, metrics: Dict[str, float], 
                     recommendations: Dict[str, Any]):
        """Print analysis summary"""
        print("\n" + "="*50)
        print("NIRF Ranking Analysis Summary")
        print("="*50)
        
        print("\nModel Performance Metrics:")
        print("-"*30)
        for metric, value in metrics.items():
            print(f"{metric}: {value:.4f}")
        
        print("\nTop Recommendations for Improvement:")
        print("-"*30)
        for i, rec in enumerate(recommendations['Feature Recommendations'][:5], 1):
            print(f"\n{i}. {rec['feature']} (Importance: {rec['importance']:.4f})")
            print(f"   {rec['recommendations']}")
        
        print("\n" + "="*50)

    def run_analysis(self, data_path: Path) -> Dict[str, Any]:
        """Execute the complete NIRF ranking analysis pipeline"""
        try:
            self.logger.info("Starting NIRF ranking analysis...")
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            
            # Process data
            df = self.process_data(data_path)
            
            # Engineer features
            features, target = self.engineer_features(df)
            
            # Train and evaluate model
            X_train, X_test, y_train, y_test, metrics = self.train_model(features, target)
            
            # Generate analysis
            analyzer = NIRFAnalyzer(self.model, features.columns)
            analysis_results = analyzer.analyze_predictions(X_test, y_test)
            recommendations = analyzer.generate_recommendations(
                self.model.get_feature_importance(features.columns),
                features
            )
            
            # Generate visualizations
            self.generate_visualizations(
                df, features, X_test, y_test, metrics, timestamp
            )
            
            # Save results
            self.save_results(metrics, analysis_results, recommendations, timestamp)
            
            # Print summary
            self.print_summary(metrics, recommendations)
            
            self.logger.info("Analysis completed successfully!")
            
            return {
                'metrics': metrics,
                'analysis_results': analysis_results,
                'recommendations': recommendations
            }
            
        except Exception as e:
            self.logger.error(f"Error during analysis: {str(e)}")
            raise

def main():
    """Main execution function"""
    try:
        # Setup paths
        base_dir = Path.cwd()
        data_path = base_dir / "data" / "raw" / "Dataset.xlsx"
        
        # Check if dataset exists
        if not data_path.exists():
            print(f"Error: Dataset not found at {data_path}")
            print("Please place your NIRF dataset Excel file in the data/raw directory.")
            sys.exit(1)
        
        # Initialize and run system
        system = NIRFRecommendationSystem()
        results = system.run_analysis(data_path)
        
        print("\nAnalysis completed successfully!")
        print("Check the reports directory for detailed results and recommendations.")
        print("Check the visualizations directory for detailed visual analysis.")
        
    except Exception as e:
        print(f"\nError: {str(e)}")
        print("Check nirf_analysis.log for detailed error information.")
        sys.exit(1)

if __name__ == "__main__":
    main()