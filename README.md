# NIRF Recommendation System

## Project Overview

The NIRF (National Institutional Ranking Framework) Recommendation System is an advanced data science project designed to provide strategic insights and performance improvement recommendations for educational institutions. By leveraging sophisticated machine learning techniques, the system analyzes institutional data and generates targeted recommendations to enhance overall performance across key ranking parameters.

## Key Features

- **Comprehensive Performance Analysis**: Evaluate institutional performance across five critical NIRF parameters
- **Machine Learning-Powered Insights**: Utilize advanced regression and ensemble learning techniques
- **Data-Driven Recommendations**: Generate actionable strategies for institutional improvement
- **Robust Data Processing**: Handle complex datasets with advanced preprocessing techniques

## Parameters Analyzed

The system provides in-depth analysis across five key NIRF parameters:
1. Teaching, Learning & Resources (TLR)
2. Research, Professional Practice & Collaborative Performance (RPC)
3. Graduation Outcomes (GO)
4. Outreach & Inclusivity (OI)
5. Perception

## Technical Architecture

### Methodology
- **Machine Learning Models**: 
  - Random Forest Regressor
  - Gradient Boosting Regressor
- **Feature Engineering**:
  - Advanced feature selection
  - Interaction feature creation
- **Preprocessing Techniques**:
  - Robust scaling
  - Missing value handling
  - Standardization

### Performance Evaluation Metrics
- R² Score
- Mean Absolute Error (MAE)
- Cross-validation Scores

## Installation

### Prerequisites
- Python 3.8+
- pip package manager

### Dependencies
```bash
pip install pandas numpy scikit-learn matplotlib seaborn openpyxl
```

### Clone the Repository
```bash
git clone https://github.com/SUDARSHANJADHAV2/Nirf-Recommendation-System.git
cd Nirf-Recommendation-System
```

### Install Required Packages
```bash
pip install -r requirements.txt
```

## Usage Example

```python
from nirf_recommendation_system import NIRFRecommendationSystem

# Initialize the system
system = NIRFRecommendationSystem()

# Load and analyze data
df = system.load_and_preprocess_data('your_institution_data.xlsx')
recommendations = system.generate_recommendations(df, institute_id='YOUR_INSTITUTE_ID')

# Visualize results
system.visualize_results(recommendations)
```

## Project Structure
```
Nirf-Recommendation-System/
│
├── data/                   # Sample datasets
├── src/                    # Source code
│   ├── preprocessing.py    # Data preprocessing module
│   ├── model_training.py   # Model training scripts
│   └── recommendation.py   # Recommendation generation module
├── notebooks/              # Jupyter notebooks for exploration
├── tests/                  # Unit tests
├── requirements.txt        # Project dependencies
└── README.md               # Project documentation
```

## Visualization Capabilities

The system provides comprehensive visualizations:
- Performance heatmaps
- Feature importance charts
- Cross-validation score distributions
- Comparative institutional analysis

## Limitations & Considerations

- Recommendations are data-driven and probabilistic
- Actual implementation requires institutional context
- Performance depends on input data quality

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Contact

Sudarshan Jadhav - [officialsudarshanjadhav2@gmail.com]

Project Link: [https://github.com/SUDARSHANJADHAV2/Nirf-Recommendation-System](https://github.com/SUDARSHANJADHAV2/Nirf-Recommendation-System)

## Acknowledgements

- National Institutional Ranking Framework (NIRF)
- Scikit-learn Community
- Open-source Machine Learning Libraries
