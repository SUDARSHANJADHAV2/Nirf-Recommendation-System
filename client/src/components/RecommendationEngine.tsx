import React, { useMemo } from 'react';
import { Lightbulb, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

// First, let's define our interfaces for type safety
interface Parameters {
    tlr_score: number;
    rpc_score: number;
    go_score: number;
    oi_score: number;
    perception_score: number;
}

interface Institution {
    institute_id: string;
    name: string;
    current_ranking: number;
    parameters: Parameters;
    location: Location;
}

interface Recommendation {
    parameter: keyof Parameters;
    currentScore: number;
    targetScore: number;
    priority: 'High' | 'Medium' | 'Low';
    actions: string[];
    impact: string;
    timeframe: string;
}

interface RecommendationEngineProps {
    institution: Institution;
    benchmarkInstitutions: Institution[];
}

const RecommendationEngine: React.FC<RecommendationEngineProps> = ({
    institution,
    benchmarkInstitutions
}) => {
    // Calculate recommendations based on current scores and benchmark data
    const recommendations = useMemo(() => {
        // First, calculate benchmark scores from top-performing institutions
        const benchmarkScores = benchmarkInstitutions
            .slice(0, 10) // Consider top 10 institutions
            .reduce((acc, inst) => ({
                tlr_score: acc.tlr_score + inst.parameters.tlr_score,
                rpc_score: acc.rpc_score + inst.parameters.rpc_score,
                go_score: acc.go_score + inst.parameters.go_score,
                oi_score: acc.oi_score + inst.parameters.oi_score,
                perception_score: acc.perception_score + inst.parameters.perception_score
            }), {
                tlr_score: 0,
                rpc_score: 0,
                go_score: 0,
                oi_score: 0,
                perception_score: 0
            });

        // Calculate average benchmark scores
        Object.keys(benchmarkScores).forEach(key => {
            benchmarkScores[key as keyof Parameters] /= 10;
        });

        // Generate recommendations based on score gaps
        return generateRecommendations(institution.parameters, benchmarkScores);
    }, [institution, benchmarkInstitutions]);

    // Helper function to generate detailed recommendations
    function generateRecommendations(
        currentScores: Parameters,
        benchmarkScores: Parameters
    ): Recommendation[] {
        const recommendations: Recommendation[] = [];

        // Define recommendation templates for each parameter
        const recommendationTemplates = {
            tlr_score: {
                actions: [
                    "Implement faculty development programs focused on modern teaching methodologies",
                    "Enhance laboratory and research infrastructure",
                    "Develop structured student mentoring programs",
                    "Increase industry expert involvement in curriculum development"
                ],
                impact: "Improved teaching quality and student learning outcomes",
                timeframe: "6-12 months"
            },
            rpc_score: {
                actions: [
                    "Establish research collaborations with premier institutions",
                    "Create research incentive programs for faculty",
                    "Develop centers of excellence in key research areas",
                    "Increase participation in funded research projects"
                ],
                impact: "Enhanced research output and industry collaboration",
                timeframe: "12-24 months"
            },
            go_score: {
                actions: [
                    "Increase industry partnerships and collaborations",
                    "Enhance placement cell activities",
                    "Organize more industrial visits and workshops"
                ],
                impact: "Better graduate outcomes and employability",
                timeframe: "6-12 months"
            },
            oi_score: {
                actions: [
                    "Improve outreach programs",
                    "Enhance infrastructure facilities",
                    "Develop inclusive education initiatives"
                ],
                impact: "Increased institutional reach and inclusivity",
                timeframe: "12-18 months"
            },
            perception_score: {
                actions: [
                    "Strengthen alumni network",
                    "Improve institutional branding",
                    "Enhance media presence"
                ],
                impact: "Enhanced institutional reputation",
                timeframe: "12-24 months"
            }
        };

        // Generate recommendations for each parameter
        Object.entries(currentScores).forEach(([param, score]) => {
            const paramKey = param as keyof Parameters;
            const benchmark = benchmarkScores[paramKey];
            const gap = benchmark - score;

            if (gap > 5) {
                recommendations.push({
                    parameter: paramKey,
                    currentScore: score,
                    targetScore: benchmark,
                    priority: gap > 15 ? 'High' : gap > 10 ? 'Medium' : 'Low',
                    actions: recommendationTemplates[paramKey]?.actions || [],
                    impact: recommendationTemplates[paramKey]?.impact || '',
                    timeframe: recommendationTemplates[paramKey]?.timeframe || ''
                });
            }
        });

        // Sort recommendations by priority
        return recommendations.sort((a, b) => {
            const priorityOrder = { High: 3, Medium: 2, Low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center mb-6">
                <Lightbulb className="w-6 h-6 text-blue-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-700">
                    Improvement Recommendations
                </h2>
            </div>

            {recommendations.length > 0 ? (
                <div className="space-y-6">
                    {recommendations.map((rec, index) => (
                        <div 
                            key={index} 
                            className="border border-gray-200 rounded-lg p-4"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-gray-800">
                                    {rec.parameter.split('_')[0].toUpperCase()} Improvement
                                </h3>
                                <span className={`
                                    px-3 py-1 rounded-full text-sm font-medium
                                    ${rec.priority === 'High' 
                                        ? 'bg-red-100 text-red-800' 
                                        : rec.priority === 'Medium'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-green-100 text-green-800'}
                                `}>
                                    {rec.priority} Priority
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div className="bg-gray-50 p-3 rounded">
                                    <div className="text-sm text-gray-600 mb-1">Current Score</div>
                                    <div className="text-2xl font-semibold text-gray-800">
                                        {rec.currentScore.toFixed(1)}
                                    </div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded">
                                    <div className="text-sm text-gray-600 mb-1">Target Score</div>
                                    <div className="text-2xl font-semibold text-blue-600">
                                        {rec.targetScore.toFixed(1)}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                                        Recommended Actions
                                    </h4>
                                    <ul className="space-y-2">
                                        {rec.actions.map((action, idx) => (
                                            <li 
                                                key={idx}
                                                className="flex items-start text-sm text-gray-600"
                                            >
                                                <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5" />
                                                {action}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700 mb-1">
                                            Expected Impact
                                        </h4>
                                        <p className="text-sm text-gray-600">{rec.impact}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700 mb-1">
                                            Implementation Timeframe
                                        </h4>
                                        <p className="text-sm text-gray-600">{rec.timeframe}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 text-gray-600">
                    No improvement recommendations at this time.
                </div>
            )}
        </div>
    );
};

export default RecommendationEngine;