import React from 'react';
import { 
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
    Radar, ResponsiveContainer, Tooltip 
} from 'recharts';
import { Award, TrendingDown, TrendingUp } from 'lucide-react';

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

interface PerformanceMetricsProps {
    institutions: Institution[];
}

const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ institutions }) => {
    if (!institutions.length) return null;

    const topInstitution = institutions[0];

    const radarData = [
        { parameter: 'Teaching & Learning', value: topInstitution.parameters.tlr_score },
        { parameter: 'Research', value: topInstitution.parameters.rpc_score },
        { parameter: 'Graduation Outcomes', value: topInstitution.parameters.go_score },
        { parameter: 'Outreach', value: topInstitution.parameters.oi_score },
        { parameter: 'Perception', value: topInstitution.parameters.perception_score }
    ];

    const averages = institutions.reduce(
        (acc, inst) => ({
            tlr: acc.tlr + inst.parameters.tlr_score,
            rpc: acc.rpc + inst.parameters.rpc_score,
            go: acc.go + inst.parameters.go_score,
            oi: acc.oi + inst.parameters.oi_score,
            perception: acc.perception + inst.parameters.perception_score,
            count: acc.count + 1
        }),
        { tlr: 0, rpc: 0, go: 0, oi: 0, perception: 0, count: 0 }
    );

    const scores = {
        tlr: { name: 'Teaching & Learning', score: topInstitution.parameters.tlr_score, avg: averages.tlr / averages.count },
        rpc: { name: 'Research', score: topInstitution.parameters.rpc_score, avg: averages.rpc / averages.count },
        go: { name: 'Graduation Outcomes', score: topInstitution.parameters.go_score, avg: averages.go / averages.count },
        oi: { name: 'Outreach', score: topInstitution.parameters.oi_score, avg: averages.oi / averages.count },
        perception: { name: 'Perception', score: topInstitution.parameters.perception_score, avg: averages.perception / averages.count }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center mb-6">
                <Award className="w-6 h-6 text-blue-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-700">Performance Metrics</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Radar Chart */}
                <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="parameter" />
                            <PolarRadiusAxis domain={[0, 100]} />
                            <Radar
                                name="Parameters"
                                dataKey="value"
                                stroke="#3b82f6"
                                fill="#3b82f6"
                                fillOpacity={0.6}
                            />
                            <Tooltip />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>

                {/* Metrics Comparison */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-600">Parameter Comparison</h3>
                    {Object.values(scores).map((score, index) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-gray-600">{score.name}</span>
                                <div className="flex items-center space-x-2">
                                    <span className="text-xs text-gray-500">Avg: {score.avg.toFixed(1)}</span>
                                    <span className="text-lg font-semibold text-gray-800">{score.score.toFixed(1)}</span>
                                    {score.score > score.avg ? (
                                        <TrendingUp className="w-4 h-4 text-green-500" />
                                    ) : (
                                        <TrendingDown className="w-4 h-4 text-red-500" />
                                    )}
                                </div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full ${
                                        score.score > score.avg ? 'bg-green-500' : 'bg-red-500'
                                    }`}
                                    style={{ width: `${score.score}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PerformanceMetrics;