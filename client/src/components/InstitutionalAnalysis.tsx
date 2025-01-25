import React, { useMemo } from 'react';
import { 
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
    Radar, ResponsiveContainer, Tooltip 
} from 'recharts';
import { Target, TrendingUp, TrendingDown } from 'lucide-react';

// We'll reuse our existing interfaces for type consistency
interface Parameters {
    tlr_score: number;
    rpc_score: number;
    go_score: number;
    oi_score: number;
    perception_score: number;
}

interface Location {
    city: string;
    state: string;
}

interface Institution {
    institute_id: string;
    name: string;
    current_ranking: number;
    parameters: Parameters;
    location: Location;
}

interface InstitutionalAnalysisProps {
    institution: Institution;
    benchmarkInstitutions: Institution[];
}

const InstitutionalAnalysis: React.FC<InstitutionalAnalysisProps> = ({
    institution,
    benchmarkInstitutions
}) => {
    // Calculate comparative metrics using useMemo for performance optimization
    const analysisData = useMemo(() => {
        // Calculate average scores of top 5 institutions for benchmarking
        const topInstitutionsAvg = benchmarkInstitutions
            .slice(0, 5)
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

        // Calculate benchmarks
        Object.keys(topInstitutionsAvg).forEach(key => {
            topInstitutionsAvg[key as keyof Parameters] /= 5;
        });

        // Prepare radar chart data with comparative analysis
        return Object.entries(institution.parameters).map(([key, value]) => ({
            parameter: key.split('_')[0].toUpperCase(),
            current: value,
            benchmark: topInstitutionsAvg[key as keyof Parameters],
            gap: topInstitutionsAvg[key as keyof Parameters] - value
        }));
    }, [institution, benchmarkInstitutions]);

    // Calculate overall performance indicators
    const performanceIndicators = useMemo(() => {
        const totalGap = analysisData.reduce((sum, item) => sum + item.gap, 0);
        const criticalAreas = analysisData
            .filter(item => item.gap > 10)
            .map(item => item.parameter);
        
        return {
            totalGap,
            criticalAreas,
            overallStatus: totalGap > 50 ? 'Needs Significant Improvement' : 
                          totalGap > 25 ? 'Improvement Required' : 'Good Standing'
        };
    }, [analysisData]);

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <Target className="w-6 h-6 text-blue-600 mr-2" />
                    <h2 className="text-lg font-semibold text-gray-700">
                        Institutional Analysis
                    </h2>
                </div>
                <div className={`px-4 py-1 rounded-full text-sm font-medium ${
                    performanceIndicators.totalGap > 50 
                        ? 'bg-red-100 text-red-800'
                        : performanceIndicators.totalGap > 25
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                }`}>
                    {performanceIndicators.overallStatus}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Radar Chart for Parameter Comparison */}
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={analysisData}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="parameter" />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} />
                            <Radar
                                name="Current Scores"
                                dataKey="current"
                                stroke="#3b82f6"
                                fill="#3b82f6"
                                fillOpacity={0.6}
                            />
                            <Radar
                                name="Benchmark"
                                dataKey="benchmark"
                                stroke="#ef4444"
                                fill="#ef4444"
                                fillOpacity={0.4}
                            />
                            <Tooltip />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>

                {/* Performance Analysis */}
                <div className="space-y-6">
                    <div>
                        <h3 className="text-sm font-medium text-gray-600 mb-4">
                            Parameter Analysis
                        </h3>
                        {analysisData.map((item, index) => (
                            <div key={index} className="mb-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium text-gray-700">
                                        {item.parameter}
                                    </span>
                                    <div className="flex items-center">
                                        {item.gap > 0 ? (
                                            <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                                        ) : (
                                            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                                        )}
                                        <span className="text-sm font-medium">
                                            Gap: {Math.abs(item.gap).toFixed(1)}
                                        </span>
                                    </div>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full ${
                                            item.gap > 10 ? 'bg-red-500' :
                                            item.gap > 5 ? 'bg-yellow-500' : 'bg-green-500'
                                        }`}
                                        style={{ width: `${(item.current / item.benchmark) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Critical Areas */}
                    {performanceIndicators.criticalAreas.length > 0 && (
                        <div className="bg-red-50 p-4 rounded-lg">
                            <h4 className="text-sm font-medium text-red-800 mb-2">
                                Critical Areas for Improvement
                            </h4>
                            <ul className="list-disc list-inside text-sm text-red-700">
                                {performanceIndicators.criticalAreas.map((area, index) => (
                                    <li key={index}>{area}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InstitutionalAnalysis;