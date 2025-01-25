import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, ArrowUp, ArrowDown } from 'lucide-react';

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
}

interface TrendAnalysisProps {
    institutions: Institution[];
}

const TrendAnalysis: React.FC<TrendAnalysisProps> = ({ institutions }) => {
    // Calculate average scores for top institutions
    const topInstitutionsData = institutions.slice(0, 20).map(inst => ({
        name: inst.name.substring(0, 15) + '...',
        TLR: inst.parameters.tlr_score,
        RPC: inst.parameters.rpc_score,
        GO: inst.parameters.go_score,
        OI: inst.parameters.oi_score,
        Perception: inst.parameters.perception_score,
        Overall: (
            inst.parameters.tlr_score * 0.3 +
            inst.parameters.rpc_score * 0.3 +
            inst.parameters.go_score * 0.2 +
            inst.parameters.oi_score * 0.1 +
            inst.parameters.perception_score * 0.1
        )
    }));

    const averageScores = institutions.reduce(
        (acc, inst) => ({
            TLR: acc.TLR + inst.parameters.tlr_score,
            RPC: acc.RPC + inst.parameters.rpc_score,
            GO: acc.GO + inst.parameters.go_score,
            OI: acc.OI + inst.parameters.oi_score,
            Perception: acc.Perception + inst.parameters.perception_score
        }),
        { TLR: 0, RPC: 0, GO: 0, OI: 0, Perception: 0 }
    );

    (Object.keys(averageScores) as (keyof typeof averageScores)[]).forEach(key => {
        averageScores[key] = +(averageScores[key] / institutions.length).toFixed(2);
    });

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center mb-6">
                <TrendingUp className="w-6 h-6 text-blue-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-700">Performance Trends</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Overall Score Distribution */}
                <div className="lg:col-span-2">
                    <h3 className="text-sm font-medium text-gray-600 mb-4">Score Distribution (Top 20 Institutions)</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={topInstitutionsData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="Overall" stroke="#3b82f6" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Average Scores */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-600">National Averages</h3>
                    <div className="space-y-3">
                        {Object.entries(averageScores).map(([key, value]) => (
                            <div key={key} className="bg-gray-50 p-4 rounded-lg">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium text-gray-600">{key}</span>
                                    <span className="text-lg font-semibold text-gray-800">{value}</span>
                                </div>
                                <div className="flex items-center">
                                    {value > 70 ? (
                                        <>
                                            <ArrowUp className="w-4 h-4 text-green-500 mr-1" />
                                            <span className="text-xs text-green-500">Above Average</span>
                                        </>
                                    ) : (
                                        <>
                                            <ArrowDown className="w-4 h-4 text-red-500 mr-1" />
                                            <span className="text-xs text-red-500">Below Average</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrendAnalysis;