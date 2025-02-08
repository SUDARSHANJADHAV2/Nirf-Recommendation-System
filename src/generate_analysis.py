import pandas as pd
import numpy as np
from pathlib import Path
import json
from datetime import datetime
from data.preprocess import NIRFDataPreprocessor
from data.validation import NIRFDataValidator
from features.build_features import NIRFFeatureBuilder
from models.train import NIRFRankingModel
from models.predict import NIRFPredictor
from visualization.visualize import NIRFVisualizer
from utils.config import ConfigurationLoader

class NIRFAnalysisGenerator:
    def __init__(self, data_path, config_path=None, output_dir='analysis_output'):
        """
        Initialize the NIRF Analysis Generator with configuration
        
        Parameters:
        -----------
        data_path : str or Path
            Path to the input dataset
        config_path : str or Path, optional
            Path to the configuration file
        output_dir : str
            Directory to store analysis outputs
        """
        self.data_path = Path(data_path)
        self.output_dir = Path(output_dir)
        
        # Load configuration
        self.config_loader = ConfigurationLoader(config_path)
        self.config_loader.validate_config()
        
        # Create output directories based on configuration
        self._setup_output_directories()
        
        # Initialize components with configuration
        self._initialize_components()
    
    def _setup_output_directories(self):
        """Set up output directories based on configuration"""
        output_config = self.config_loader.get_output_config()
        
        for directory in output_config['directories']:
            (self.output_dir / directory).mkdir(parents=True, exist_ok=True)
    
    def _initialize_components(self):
        """Initialize analysis components with configuration"""
        data_config = self.config_loader.get_data_processing_config()
        feature_config = self.config_loader.get_feature_engineering_config()
        visualization_config = self.config_loader.get_visualization_config()
        
        self.preprocessor = NIRFDataPreprocessor()
        self.validator = NIRFDataValidator(data_config['validation'])
        self.feature_builder = NIRFFeatureBuilder(feature_config)
        self.visualizer = NIRFVisualizer(
            output_dir=self.output_dir/'visualizations',
            config=visualization_config
        )
    
    def validate_and_preprocess_data(self):
        """Load, validate, and preprocess the input data"""
        print("\nStep 1: Data Validation and Preprocessing")
        print("----------------------------------------")
        
        df = self.preprocessor.load_data(self.data_path)
        validation_report = self.validator.validate_dataset(df)
        
        if validation_report['status'] == 'failed':
            raise ValueError("Data validation failed:\n" + 
                           "\n".join(f"- {issue}" for issue in validation_report['issues']))
        
        return df
    
    def build_features(self, df):
        """Build features using configuration settings"""
        print("\nStep 2: Feature Engineering")
        print("-------------------------")
        
        features = self.feature_builder.build_all_features(df)
        
        # Save features based on configuration
        output_config = self.config_loader.get_output_config()
        if 'csv' in output_config['save_formats']['features']:
            features.to_csv(self.output_dir/'data'/'engineered_features.csv', index=False)
        
        return features
    
    def train_and_evaluate_model(self, features, target):
        """Train and evaluate model using configuration settings"""
        print("\nStep 3: Model Training and Evaluation")
        print("-----------------------------------")
        
        model_config = self.config_loader.get_model_config()
        split_config = model_config['train_test_split']
        
        from sklearn.model_selection import train_test_split
        X_train, X_test, y_train, y_test = train_test_split(
            features, target,
            test_size=split_config['test_size'],
            random_state=split_config['random_state']
        )
        
        model = NIRFRankingModel(model_config)
        model.train(X_train, y_train)
        metrics = model.evaluate(X_test, y_test)
        
        # Save model based on configuration
        output_config = self.config_loader.get_output_config()
        if 'joblib' in output_config['save_formats']['model']:
            model_path = self.output_dir/'models'/'nirf_ranking_model.joblib'
            model.save_model(model_path)
        
        return model, (X_train, X_test, y_train, y_test), metrics
    
    def generate_comprehensive_analysis(self):
        """Generate comprehensive NIRF ranking analysis"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        try:
            # Execute analysis pipeline
            df = self.validate_and_preprocess_data()
            features = self.build_features(df)
            
            # Prepare features for modeling
            feature_config = self.config_loader.get_feature_engineering_config()
            X = features.drop(
                ['Ranking'] + feature_config['categorical_features'], 
                axis=1
            )
            y = features['Ranking']
            
            # Train and evaluate model
            model, (X_train, X_test, y_train, y_test), metrics = \
                self.train_and_evaluate_model(X, y)
            
            # Generate predictions
            predictor = NIRFPredictor(model)
            predictions = predictor.predict_with_confidence(X_test)
            
            # Generate visualizations based on configuration
            visualization_data = {
                'raw_data': df,
                'feature_importance': model.get_feature_importance(X.columns),
                'actual_rankings': y_test,
                'predictions': predictions['predictions'],
                'confidence_intervals': (
                    predictions['lower_bound'], 
                    predictions['upper_bound']
                )
            }
            
            self.visualizer.generate_visualizations(
                data=visualization_data,
                predictions=predictions['predictions'],
                model_metrics=metrics
            )
            
            # Save analysis report based on configuration
            output_config = self.config_loader.get_output_config()
            if 'json' in output_config['save_formats']['report']:
                report = self._generate_analysis_report(
                    df, model, metrics, predictions, timestamp
                )
                report_path = self.output_dir/'reports'/f'analysis_report_{timestamp}.json'
                with open(report_path, 'w') as f:
                    json.dump(report, f, indent=4)
            
            print("\nAnalysis Complete!")
            print("------------------")
            print(f"Results saved in: {self.output_dir}")
            print(f"Model Performance:")
            for metric, value in metrics.items():
                print(f"- {metric}: {value:.4f}")
            
        except Exception as e:
            print(f"\nError during analysis: {str(e)}")
            raise
    
    def _generate_analysis_report(self, df, model, metrics, predictions, timestamp):
        """Generate analysis report based on configuration"""
        output_config = self.config_loader.get_output_config()
        report_sections = output_config['report_sections']
        
        report = {
            'timestamp': timestamp,
            'model_performance': metrics if 'model_performance' in report_sections else None,
            'feature_importance': model.get_feature_importance(df.columns) \
                if 'feature_importance' in report_sections else None,
            'analysis_summary': {
                'model_quality': 'Good' if metrics['r2'] > 0.7 else 
                               'Moderate' if metrics['r2'] > 0.5 else 
                               'Needs Improvement'
            } if 'analysis_summary' in report_sections else None
        }
        
        return {k: v for k, v in report.items() if v is not None}

def main():
    base_dir = Path(__file__).resolve().parent.parent
    data_path = base_dir / "data" / "raw" / "Dataset.xlsx"
    config_path = base_dir / "config" / "analysis_config.yaml"
    output_dir = base_dir / "analysis_output"
    
    analyzer = NIRFAnalysisGenerator(
        data_path=data_path,
        config_path=config_path,
        output_dir=output_dir
    )
    analyzer.generate_comprehensive_analysis()

if __name__ == "__main__":
    main()