import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from pathlib import Path
import logging

class NIRFVisualizer:
    def __init__(self, output_dir='visualizations'):
        """Initialize the NIRF Visualizer"""
        self.logger = logging.getLogger(__name__)
        self.base_dir = Path(output_dir)
        self._setup_directories()
        self._set_style_properties()
        
    def _setup_directories(self):
        """Create organized directory structure for visualizations"""
        try:
            directories = [
                'feature_analysis/importance_plots',
                'feature_analysis/correlation_plots',
                'performance_metrics',
                'ranking_analysis',
                'interactive_plots'
            ]
            
            for directory in directories:
                (self.base_dir / directory).mkdir(parents=True, exist_ok=True)
            
            self.logger.info("Visualization directories created successfully")
        except Exception as e:
            self.logger.error(f"Error creating visualization directories: {str(e)}")
            raise

    def _set_style_properties(self):
        """Set visualization style properties"""
        try:
            # Set default style parameters
            plt.style.use('default')
            sns.set_theme(style="whitegrid")
            
            # Set color palette
            self.color_palette = sns.color_palette("husl", 8)
            
            # Configure plot parameters
            self.plot_params = {
                'figure.figsize': (12, 8),
                'axes.labelsize': 12,
                'axes.titlesize': 14,
                'xtick.labelsize': 10,
                'ytick.labelsize': 10
            }
            plt.rcParams.update(self.plot_params)
        except Exception as e:
            self.logger.error(f"Error setting style properties: {str(e)}")
            raise

    def create_feature_importance_plot(self, importance_dict, timestamp):
        """Create feature importance visualization"""
        try:
            sorted_features = dict(sorted(
                importance_dict.items(),
                key=lambda x: x[1],
                reverse=True
            )[:10])

            # Create static plot
            plt.figure(figsize=(12, 6))
            bars = plt.bar(sorted_features.keys(), sorted_features.values(), 
                         color=self.color_palette[0])
            plt.xticks(rotation=45, ha='right')
            plt.title('Top 10 Features Affecting NIRF Ranking')
            plt.xlabel('Features')
            plt.ylabel('Importance Score')

            # Add value labels
            for bar in bars:
                height = bar.get_height()
                plt.text(bar.get_x() + bar.get_width()/2., height,
                        f'{height:.3f}',
                        ha='center', va='bottom')

            plt.tight_layout()
            save_path = self.base_dir / 'feature_analysis/importance_plots' / f'feature_importance_{timestamp}.png'
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            plt.close()

            # Create interactive plot
            fig = go.Figure(data=[
                go.Bar(
                    x=list(sorted_features.keys()),
                    y=list(sorted_features.values()),
                    marker_color='rgb(55, 83, 109)'
                )
            ])

            fig.update_layout(
                title='Feature Importance Analysis',
                xaxis_title='Features',
                yaxis_title='Importance Score',
                xaxis_tickangle=-45,
                template='plotly_white'
            )

            interactive_save_path = self.base_dir / 'interactive_plots' / f'feature_importance_{timestamp}.html'
            fig.write_html(str(interactive_save_path))

            self.logger.info(f"Feature importance plots saved successfully")
            
        except Exception as e:
            self.logger.error(f"Error creating feature importance plots: {str(e)}")
            raise

    def create_correlation_matrix(self, df, main_params, timestamp):
        """Create correlation matrix visualization"""
        try:
            correlation_matrix = df[main_params].corr()

            # Create static plot
            plt.figure(figsize=(10, 8))
            sns.heatmap(correlation_matrix, 
                       annot=True, 
                       cmap='coolwarm', 
                       center=0,
                       fmt='.2f')
            plt.title('Correlation between NIRF Parameters')
            plt.tight_layout()
            
            save_path = self.base_dir / 'feature_analysis/correlation_plots' / f'parameter_correlations_{timestamp}.png'
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            plt.close()

            # Create interactive plot
            fig = go.Figure(data=go.Heatmap(
                z=correlation_matrix,
                x=main_params,
                y=main_params,
                colorscale='RdBu',
                zmin=-1,
                zmax=1
            ))

            fig.update_layout(
                title='Parameter Correlation Matrix',
                xaxis_title='Parameters',
                yaxis_title='Parameters',
                template='plotly_white'
            )

            interactive_save_path = self.base_dir / 'interactive_plots' / f'correlation_matrix_{timestamp}.html'
            fig.write_html(str(interactive_save_path))

            self.logger.info(f"Correlation matrix plots saved successfully")
            
        except Exception as e:
            self.logger.error(f"Error creating correlation matrix plots: {str(e)}")
            raise

    def create_prediction_analysis(self, y_true, y_pred, timestamp):
        """Create prediction analysis visualizations"""
        try:
            # Create scatter plot
            plt.figure(figsize=(10, 6))
            plt.scatter(y_true, y_pred, alpha=0.5, color=self.color_palette[2])
            
            # Add perfect prediction line
            min_val = min(y_true.min(), y_pred.min())
            max_val = max(y_true.max(), y_pred.max())
            plt.plot([min_val, max_val], [min_val, max_val], 
                    'r--', lw=2, label='Perfect Prediction')
            
            plt.xlabel('Actual Rankings')
            plt.ylabel('Predicted Rankings')
            plt.title('Prediction Accuracy Analysis')
            plt.legend()
            
            save_path = self.base_dir / 'performance_metrics' / f'prediction_accuracy_{timestamp}.png'
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            plt.close()

            # Create error distribution plot
            errors = y_pred - y_true
            plt.figure(figsize=(10, 6))
            plt.hist(errors, bins=30, edgecolor='black', color=self.color_palette[3])
            plt.xlabel('Prediction Error')
            plt.ylabel('Frequency')
            plt.title('Error Distribution')
            
            error_path = self.base_dir / 'performance_metrics' / f'error_distribution_{timestamp}.png'
            plt.savefig(error_path, dpi=300, bbox_inches='tight')
            plt.close()

            # Create interactive scatter plot
            fig = go.Figure(data=go.Scatter(
                x=y_true,
                y=y_pred,
                mode='markers',
                marker=dict(color='blue', opacity=0.6),
                name='Rankings'
            ))

            fig.add_trace(go.Scatter(
                x=[min_val, max_val],
                y=[min_val, max_val],
                mode='lines',
                name='Perfect Prediction',
                line=dict(color='red', dash='dash')
            ))

            fig.update_layout(
                title='Prediction Accuracy Analysis',
                xaxis_title='Actual Rankings',
                yaxis_title='Predicted Rankings',
                template='plotly_white'
            )

            interactive_save_path = self.base_dir / 'interactive_plots' / f'prediction_analysis_{timestamp}.html'
            fig.write_html(str(interactive_save_path))

            self.logger.info(f"Prediction analysis plots saved successfully")
            
        except Exception as e:
            self.logger.error(f"Error creating prediction analysis plots: {str(e)}")
            raise

    def create_performance_metrics_plot(self, metrics, timestamp):
        """Create performance metrics visualization"""
        try:
            metrics_df = pd.DataFrame(list(metrics.items()), 
                                    columns=['Metric', 'Value'])

            # Create static plot
            plt.figure(figsize=(10, 6))
            bars = plt.bar(metrics_df['Metric'], metrics_df['Value'], 
                         color=self.color_palette[4])
            plt.xticks(rotation=45)
            plt.title('Model Performance Metrics')
            plt.ylabel('Value')

            # Add value labels
            for bar in bars:
                height = bar.get_height()
                plt.text(bar.get_x() + bar.get_width()/2., height,
                        f'{height:.4f}',
                        ha='center', va='bottom')

            plt.tight_layout()
            save_path = self.base_dir / 'performance_metrics' / f'model_metrics_{timestamp}.png'
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            plt.close()

            # Create interactive plot
            fig = go.Figure(data=[
                go.Bar(
                    x=metrics_df['Metric'],
                    y=metrics_df['Value'],
                    marker_color='rgb(55, 83, 109)'
                )
            ])

            fig.update_layout(
                title='Model Performance Metrics',
                xaxis_title='Metrics',
                yaxis_title='Value',
                template='plotly_white'
            )

            interactive_save_path = self.base_dir / 'interactive_plots' / f'performance_metrics_{timestamp}.html'
            fig.write_html(str(interactive_save_path))

            self.logger.info(f"Performance metrics plots saved successfully")
            
        except Exception as e:
            self.logger.error(f"Error creating performance metrics plots: {str(e)}")
            raise

    def create_regional_analysis(self, df, timestamp):
        """Create regional analysis visualization"""
        try:
            state_metrics = df.groupby('State')['Ranking'].agg(['mean', 'count'])
            state_metrics = state_metrics.sort_values('mean')

            # Create static plot
            fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 6))

            # Average ranking by state
            state_metrics['mean'].plot(kind='bar', ax=ax1, color=self.color_palette[5])
            ax1.set_title('Average Ranking by State')
            ax1.set_xlabel('State')
            ax1.set_ylabel('Average Ranking')
            ax1.tick_params(axis='x', rotation=90)

            # Number of institutions by state
            state_metrics['count'].plot(kind='bar', ax=ax2, color=self.color_palette[6])
            ax2.set_title('Number of Institutions by State')
            ax2.set_xlabel('State')
            ax2.set_ylabel('Count')
            ax2.tick_params(axis='x', rotation=90)

            plt.tight_layout()
            save_path = self.base_dir / 'ranking_analysis' / f'regional_analysis_{timestamp}.png'
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            plt.close()

            # Create interactive plot
            fig = make_subplots(rows=1, cols=2, 
                              subplot_titles=('Average Ranking by State',
                                            'Number of Institutions by State'))

            fig.add_trace(
                go.Bar(x=state_metrics.index, y=state_metrics['mean'],
                      name='Average Ranking'),
                row=1, col=1
            )

            fig.add_trace(
                go.Bar(x=state_metrics.index, y=state_metrics['count'],
                      name='Institution Count'),
                row=1, col=2
            )

            fig.update_layout(
                height=600,
                showlegend=True,
                template='plotly_white'
            )

            fig.update_xaxes(tickangle=45)

            interactive_save_path = self.base_dir / 'interactive_plots' / f'regional_analysis_{timestamp}.html'
            fig.write_html(str(interactive_save_path))

            self.logger.info(f"Regional analysis plots saved successfully")
            
        except Exception as e:
            self.logger.error(f"Error creating regional analysis plots: {str(e)}")
            raise

    def generate_all_visualizations(self, data, results, timestamp):
        """Generate all visualizations"""
        try:
            self.logger.info("Starting visualization generation...")

            # Create feature importance plot
            self.create_feature_importance_plot(
                results['feature_importance'],
                timestamp
            )

            # Create correlation matrix
            main_params = ['TLR(100)', 'RPC(100)', 'GO(100)', 'OI(100)', 
                         'Perception(100)']
            self.create_correlation_matrix(
                data['raw_data'],
                main_params,
                timestamp
            )

            # Create prediction analysis
            self.create_prediction_analysis(
                results['actual_rankings'],
                results['predictions'],
                timestamp
            )

            # Create performance metrics plot
            self.create_performance_metrics_plot(
                results['metrics'],
                timestamp
            )

            # Create regional analysis
            self.create_regional_analysis(
                data['raw_data'],
                timestamp
            )

            self.logger.info("All visualizations generated successfully")
            
        except Exception as e:
            self.logger.error(f"Error generating visualizations: {str(e)}")
            raise