import pandas as pd
import numpy as np
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
from pathlib import Path
import json
from datetime import datetime

class NIRFAnalyzer:
    def __init__(self, model, feature_names):
        """
        Initialize the NIRF Analyzer.
        
        Parameters:
        -----------
        model : NIRFRankingModel
            Trained model instance
        feature_names : list
            List of feature names used in the model
        """
        self.model = model
        self.feature_names = feature_names
        
    def analyze_predictions(self, X_test, y_test):
        """
        Analyze model predictions and performance metrics.
        
        Parameters:
        -----------
        X_test : array-like
            Test features
        y_test : array-like
            True target values
            
        Returns:
        --------
        dict : Detailed prediction analysis results
        """
        predictions = self.model.predict(X_test)
        
        # Calculate performance metrics
        mse = mean_squared_error(y_test, predictions)
        rmse = np.sqrt(mse)
        r2 = r2_score(y_test, predictions)
        mae = mean_absolute_error(y_test, predictions)
        
        # Calculate prediction errors
        errors = predictions - y_test
        
        analysis_results = {
            'Performance Metrics': {
                'Mean Squared Error': float(mse),
                'Root Mean Squared Error': float(rmse),
                'R-squared Score': float(r2),
                'Mean Absolute Error': float(mae)
            },
            'Error Analysis': {
                'Mean Error': float(np.mean(errors)),
                'Error Standard Deviation': float(np.std(errors)),
                'Maximum Error': float(np.max(np.abs(errors))),
                'Error Distribution': {
                    'Q1': float(np.percentile(errors, 25)),
                    'Median': float(np.median(errors)),
                    'Q3': float(np.percentile(errors, 75))
                }
            },
            'Prediction Statistics': {
                'Mean Predicted Ranking': float(np.mean(predictions)),
                'Std Predicted Ranking': float(np.std(predictions)),
                'Min Predicted Ranking': float(np.min(predictions)),
                'Max Predicted Ranking': float(np.max(predictions))
            }
        }
        
        return analysis_results

    def generate_recommendations(self, feature_importance, X):
        """
        Generate actionable recommendations based on feature importance and data.
        
        Parameters:
        -----------
        feature_importance : dict
            Dictionary of feature importance scores
        X : DataFrame
            Feature data
            
        Returns:
        --------
        dict : Recommendations and improvement strategies
        """
        all_recommendations = []
        
        # Process top features
        sorted_features = sorted(
            feature_importance.items(),
            key=lambda x: x[1],
            reverse=True
        )
        
        for feature, importance in sorted_features[:10]:
            feature_stats = {
                'mean': float(X[feature].mean()),
                'std': float(X[feature].std()),
                'min': float(X[feature].min()),
                'max': float(X[feature].max()),
                'median': float(X[feature].median())
            }
            
            recommendation = {
                'feature': feature,
                'importance': float(importance),
                'statistics': feature_stats,
                'recommendations': self._generate_specific_recommendations(
                    feature, 
                    feature_stats
                ),
                'improvement_potential': float(feature_stats['max'] - feature_stats['mean'])
            }
            
            all_recommendations.append(recommendation)
        
        # Generate category-wise recommendations
        category_recommendations = self._generate_category_recommendations(
            feature_importance
        )
        
        recommendations = {
            'Feature Recommendations': all_recommendations,
            'Category Recommendations': category_recommendations,
            'Strategic Recommendations': self._generate_strategic_recommendations()
        }
        
        return recommendations

    def _generate_specific_recommendations(self, feature, stats):
        """
        Generate specific recommendations for individual features.
        
        Parameters:
        -----------
        feature : str
            Feature name
        stats : dict
            Feature statistics
            
        Returns:
        --------
        str : Specific recommendation
        """
        base_rec = f"Current average: {stats['mean']:.2f} (range: {stats['min']:.2f} to {stats['max']:.2f}). "
        
        if 'TLR' in feature:
            if 'FSR' in feature:
                return base_rec + "Improve faculty-student ratio through strategic faculty recruitment and optimal class sizing. Consider hiring more qualified faculty and managing enrollment numbers."
            elif 'FQE' in feature:
                return base_rec + "Enhance faculty qualifications by recruiting more PhD holders and supporting existing faculty in pursuing higher education. Implement faculty development programs."
            elif 'SS' in feature:
                return base_rec + "Focus on student strength by optimizing admission processes and increasing program diversity. Consider adding new programs and improving marketing efforts."
            return base_rec + "Enhance teaching-learning resources through infrastructure improvements and modernized teaching methodologies."
            
        elif 'RPC' in feature:
            if 'PU' in feature:
                return base_rec + "Increase research publications in high-impact journals. Support faculty with research grants and reduced teaching loads to focus on research."
            elif 'QP' in feature:
                return base_rec + "Improve citation metrics through impactful research. Encourage collaborative research projects and publication in high-impact journals."
            return base_rec + "Enhance research output through increased funding, industry collaboration, and research infrastructure development."
            
        elif 'GO' in feature:
            if 'GPH' in feature:
                return base_rec + "Focus on improving graduation rates and higher studies placement. Implement student support programs and career guidance services."
            elif 'GMS' in feature:
                return base_rec + "Enhance median salary through improved industry connections and placement preparation. Develop industry-relevant skills training programs."
            return base_rec + "Improve overall graduation outcomes through comprehensive student development and career support programs."
            
        elif 'OI' in feature:
            if 'RD' in feature:
                return base_rec + "Increase regional diversity through targeted outreach programs and admission strategies. Consider scholarship programs for students from different regions."
            elif 'WD' in feature:
                return base_rec + "Improve gender diversity in both student and faculty populations. Implement specific programs to encourage women's participation in engineering."
            return base_rec + "Enhance outreach and inclusivity through targeted programs and inclusive policies."
            
        return base_rec + f"Focus on improving {feature} performance through systematic evaluation and targeted improvements."

    def _generate_category_recommendations(self, feature_importance):
        """
        Generate recommendations for main NIRF categories.
        
        Parameters:
        -----------
        feature_importance : dict
            Dictionary of feature importance scores
            
        Returns:
        --------
        dict : Category-wise recommendations
        """
        categories = {
            'TLR': ('Teaching, Learning & Resources', []),
            'RPC': ('Research & Professional Practice', []),
            'GO': ('Graduation Outcomes', []),
            'OI': ('Outreach & Inclusivity', []),
            'Perception': ('Perception', [])
        }
        
        for feature, importance in feature_importance.items():
            for category in categories:
                if category in feature:
                    categories[category][1].append((feature, importance))
        
        recommendations = {}
        for category, (full_name, features) in categories.items():
            if features:
                total_importance = sum(imp for _, imp in features)
                recommendations[category] = {
                    'category_name': full_name,
                    'total_importance': float(total_importance),
                    'key_features': sorted(features, key=lambda x: x[1], reverse=True)[:3],
                    'improvement_strategies': self._get_category_strategies(category)
                }
        
        return recommendations

    def _get_category_strategies(self, category):
        """
        Get improvement strategies for specific categories.
        
        Parameters:
        -----------
        category : str
            Category name
            
        Returns:
        --------
        list : List of improvement strategies
        """
        strategies = {
            'TLR': [
                "Implement comprehensive faculty development programs",
                "Enhance infrastructure and learning resources",
                "Optimize student-faculty ratio through strategic hiring",
                "Modernize teaching methodologies and tools",
                "Strengthen laboratory and research facilities"
            ],
            'RPC': [
                "Establish research incentive programs",
                "Create research collaboration networks",
                "Increase research funding opportunities",
                "Enhance industry-academia partnerships",
                "Support faculty publication in high-impact journals"
            ],
            'GO': [
                "Strengthen placement cell activities",
                "Develop strategic industry partnerships",
                "Enhance student skill development programs",
                "Implement career guidance and mentoring",
                "Create alumni networking platforms"
            ],
            'OI': [
                "Implement diversity inclusion programs",
                "Develop regional outreach initiatives",
                "Create support systems for diverse student groups",
                "Establish scholarship programs",
                "Enhance infrastructure for inclusive education"
            ],
            'Perception': [
                "Enhance industry engagement programs",
                "Improve academic brand building",
                "Strengthen alumni networks and engagement",
                "Develop media and public relations strategy",
                "Showcase institutional achievements and success stories"
            ]
        }
        return strategies.get(category, [])

    def _generate_strategic_recommendations(self):
        """
        Generate strategic recommendations for overall improvement.
        
        Returns:
        --------
        list : Strategic recommendations
        """
        return [
            "Develop a comprehensive strategy aligned with NIRF parameters",
            "Establish regular monitoring and evaluation systems",
            "Create cross-functional teams for parameter-specific improvements",
            "Implement best practices from top-performing institutions",
            "Focus on sustainable long-term improvements",
            "Invest in digital infrastructure and modern teaching tools",
            "Strengthen industry-academia partnerships",
            "Enhance research ecosystem and support",
            "Improve student support services and career development",
            "Build strong alumni networks and engagement programs"
        ]