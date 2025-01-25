import React, { useMemo } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, AreaChart, Area, ComposedChart, Bar
} from 'recharts';
import { TrendingUp, Award, Target } from 'lucide-react';

// Define our type interfaces for strong typing
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

interface RankingsAnalysisProps {
    institutions: Institution[];
}

const RankingsAnalysis: React.FC<RankingsAnalysisProps> = ({ institutions }) => {
    // Calculate ranking distributions and insights using useMemo for performance
    const rankingInsights = useMemo(() => {
        // Group institutions by ranking ranges for distribution analysis
        const rankingRanges = {
            'Top 50': institutions.filter(i => i.current_ranking <= 50).length,
            '51-100': institutions.filter(i => i.current_ranking > 50 && i.current_ranking <= 100).length,
            '101-200': institutions.filter(i => i.current_ranking > 100 && i.current_ranking <= 200).length,
            '201+': institutions.filter(i => i.current_ranking > 200).length
        };

        // Calculate parameter averages for different ranking tiers
        const topTierAvg = calculateTierAverages(institutions.filter(i => i.current_ranking <= 50));
        const midTierAvg = calculateTierAverages(institutions.filter(i => i.current_ranking > 50 && i.current_ranking <= 150));
        const lowerTierAvg = calculateTierAverages(institutions.filter(i => i.current_ranking > 150));

        return {
            distribution: rankingRanges,
            tierComparison: [
                { tier: 'Top Tier', ...topTierAvg },
                { tier: 'Mid Tier', ...midTierAvg },
                { tier: 'Lower Tier', ...lowerTierAvg }
            ]
        };
    }, [institutions]);

    // Helper function to calculate average parameters for a tier
    function calculateTierAverages(institutions: Institution[]) {
        if (!institutions.length) return {
            tlr: 0, rpc: 0, go: 0, oi: 0, perception: 0
        };

        const sum = institutions.reduce((acc, inst) => ({
            tlr: acc.tlr + inst.parameters.tlr_score,
            rpc: acc.rpc + inst.parameters.rpc_score,
            go: acc.go + inst.parameters.go_score,
            oi: acc.oi + inst.parameters.oi_score,
            perception: acc.perception + inst.parameters.perception_score
        }), { tlr: 0, rpc: 0, go: 0, oi: 0, perception: 0 });

        return {
            tlr: sum.tlr / institutions.length,
            rpc: sum.rpc / institutions.length,
            go: sum.go / institutions.length,
            oi: sum.oi / institutions.length,
            perception: sum.perception / institutions.length
        };
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center mb-6">
                <Target className="w-6 h-6 text-blue-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-700">Rankings Analysis</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Ranking Distribution Chart */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-600">Ranking Distribution</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                data={Object.entries(rankingInsights.distribution).map(([range, count]) => ({
                                    range,
                                    count
                                }))}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="range" />
                                <YAxis />
                                <Tooltip />
                                <Area 
                                    type="monotone" 
                                    dataKey="count" 
                                    stroke="#3b82f6" 
                                    fill="#93c5fd" 
                                    name="Institutions"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Parameter Comparison Across Tiers */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-600">Parameter Comparison by Tier</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={rankingInsights.tierComparison}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="tier" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="tlr" name="TLR" fill="#3b82f6" />
                                <Bar dataKey="rpc" name="RPC" fill="#ef4444" />
                                <Line 
                                    type="monotone" 
                                    dataKey="perception" 
                                    name="Perception" 
                                    stroke="#8b5cf6" 
                                    strokeWidth={2} 
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Key Insights */}
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {rankingInsights.tierComparison.map((tier, index) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center mb-2">
                                <Award className={`w-5 h-5 ${
                                    index === 0 ? 'text-yellow-500' :
                                    index === 1 ? 'text-gray-500' : 'text-bronze-500'
                                } mr-2`} />
                                <h4 className="font-medium text-gray-700">{tier.tier}</h4>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">TLR Score</span>
                                    <span className="font-medium">{tier.tlr.toFixed(1)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">RPC Score</span>
                                    <span className="font-medium">{tier.rpc.toFixed(1)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Perception</span>
                                    <span className="font-medium">{tier.perception.toFixed(1)}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default RankingsAnalysis;