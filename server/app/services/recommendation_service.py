from typing import List, Dict
from ..models.institution import NIRFParameters

class RecommendationService:
    def __init__(self):
        self.parameter_weights = {
            'tlr_score': 0.30,       # Teaching Learning & Resources
            'rpc_score': 0.30,       # Research & Professional Practice
            'go_score': 0.20,        # Graduation Outcomes
            'oi_score': 0.10,        # Outreach & Inclusivity
            'perception_score': 0.10  # Perception
        }
        
        self.benchmark_scores = {
            'tlr_score': 85.0,
            'rpc_score': 80.0,
            'go_score': 85.0,
            'oi_score': 75.0,
            'perception_score': 70.0
        }

    def generate_recommendations(self, parameters: NIRFParameters) -> List[Dict]:
        recommendations = []
        parameter_scores = parameters.model_dump()

        for param_name, current_score in parameter_scores.items():
            benchmark = self.benchmark_scores[param_name]
            improvement_needed = benchmark - current_score

            if improvement_needed > 0:
                recommendations.append({
                    'parameter': param_name,
                    'current_score': current_score,
                    'target_score': benchmark,
                    'improvement_needed': improvement_needed,
                    'priority': self._calculate_priority(improvement_needed),
                    'suggestions': self._get_parameter_suggestions(param_name)
                })

        return sorted(recommendations, key=lambda x: x['improvement_needed'], reverse=True)

    def _calculate_priority(self, gap: float) -> str:
        if gap > 15:
            return "High"
        elif gap > 8:
            return "Medium"
        return "Low"

    def _get_parameter_suggestions(self, parameter: str) -> List[str]:
        suggestions_map = {
            'tlr_score': [
                "Implement faculty development programs to enhance teaching quality",
                "Upgrade laboratory and research infrastructure",
                "Improve student-faculty ratio through strategic hiring"
            ],
            'rpc_score': [
                "Establish research collaborations with premier institutions",
                "Increase research publication output in indexed journals",
                "Develop industry-sponsored research projects"
            ],
            'go_score': [
                "Strengthen placement cell and industry connections",
                "Implement career guidance and skill development programs",
                "Establish alumni mentorship programs"
            ],
            'oi_score': [
                "Develop programs to increase student diversity",
                "Enhance facilities for differently-abled students",
                "Implement inclusive education policies"
            ],
            'perception_score': [
                "Enhance institutional branding and visibility",
                "Organize national-level technical events",
                "Increase industry engagement through consultancy"
            ]
        }
        return suggestions_map.get(parameter, [])