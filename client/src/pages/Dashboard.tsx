import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
    ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis 
} from 'recharts';
import { 
    TrendingUp, TrendingDown, Award, Target, 
    AlertCircle, ChevronUp, ChevronDown 
} from 'lucide-react';
import { institutionService } from '../services/api';
import { 
    Institution, 
    Parameters,
    Location,
    HistoricalDataPoint
} from '../types';

// Define interfaces specific to the dashboard component
interface DashboardMetrics {
    overall_score: number;
    ranking_change: number;
    parameter_scores: Record<keyof Parameters, number>;
    improvements_needed: Array<{
        parameter: keyof Parameters;
        current: number;
        target: number;
        gap: number;
    }>;
}

interface ParameterComparison {
    parameter: keyof Parameters;
    institution_score: number;
    benchmark_score: number;
    difference: number;
}

interface TrendData {
    parameter: keyof Parameters;
    current_value: number;
    previous_value: number;
    change_percentage: number;
}

const Dashboard: React.FC = () => {
    // Fetch institutions data using React Query
    const { data: institutions = [], isLoading } = useQuery<Institution[]>({
        queryKey: ['institutions'],
        queryFn: institutionService.getAllInstitutions
    });

    // Calculate dashboard metrics using useMemo for performance
    const dashboardMetrics = useMemo(() => {
        if (!institutions.length) return null;

        const currentInstitution = institutions[0];
        const parameterKeys: (keyof Parameters)[] = [
            'tlr_score',
            'rpc_score',
            'go_score',
            'oi_score',
            'perception_score'
        ];

        // Calculate benchmark scores from top 10 institutions
        const benchmarkScores = institutions
            .slice(0, 10)
            .reduce((acc, inst) => {
                parameterKeys.forEach(param => {
                    acc[param] = (acc[param] || 0) + inst.parameters[param];
                });
                return acc;
            }, {} as Record<keyof Parameters, number>);

        // Normalize benchmark scores
        parameterKeys.forEach(param => {
            benchmarkScores[param] = benchmarkScores[param] / 10;
        });

        // Calculate parameter comparisons
        const parameterComparisons: ParameterComparison[] = parameterKeys.map(param => ({
            parameter: param,
            institution_score: currentInstitution.parameters[param],
            benchmark_score: benchmarkScores[param],
            difference: currentInstitution.parameters[param] - benchmarkScores[param]
        }));

        // Calculate trend data safely handling historical data
        const trendData: TrendData[] = parameterKeys.map(param => {
            const currentValue = currentInstitution.parameters[param];
            const previousValue = currentInstitution.historical_data?.[0]?.parameters[param] ?? currentValue;
            
            return {
                parameter: param,
                current_value: currentValue,
                previous_value: previousValue,
                change_percentage: previousValue !== 0 ? 
                    ((currentValue - previousValue) / previousValue) * 100 : 0
            };
        });

        // Calculate overall metrics
        const overall_score = (
            currentInstitution.parameters.tlr_score * 0.3 +
            currentInstitution.parameters.rpc_score * 0.3 +
            currentInstitution.parameters.go_score * 0.2 +
            currentInstitution.parameters.oi_score * 0.1 +
            currentInstitution.parameters.perception_score * 0.1
        );

        const previousRanking = currentInstitution.historical_data?.[0]?.ranking;
        const ranking_change = previousRanking ? previousRanking - currentInstitution.current_ranking : 0;

        // Calculate improvements needed
        const improvements_needed = parameterComparisons
            .filter(comp => comp.difference < 0)
            .map(comp => ({
                parameter: comp.parameter,
                current: comp.institution_score,
                target: comp.benchmark_score,
                gap: Math.abs(comp.difference)
            }));

        return {
            institution: currentInstitution,
            overall_score,
            ranking_change,
            parameter_scores: currentInstitution.parameters,
            improvements_needed,
            parameterComparisons,
            trendData
        };
    }, [institutions]);

    // Loading state handler
    if (isLoading || !dashboardMetrics) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-lg text-gray-600">
                    {isLoading ? "Loading dashboard data..." : "No data available"}
                </div>
            </div>
        );
    }

    // Destructure metrics for easier access
    const {
        institution,
        overall_score,
        ranking_change,
        parameter_scores,
        improvements_needed,
        parameterComparisons,
        trendData
    } = dashboardMetrics;

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header Section */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800">{institution.name}</h1>
                <p className="text-gray-600 mt-2">
                    Current Ranking: #{institution.current_ranking}
                    {ranking_change !== 0 && (
                        <span className={`ml-2 ${ranking_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {ranking_change > 0 ? 
                                <ChevronUp className="inline w-4 h-4" /> : 
                                <ChevronDown className="inline w-4 h-4" />
                            }
                            {Math.abs(ranking_change)} positions
                        </span>
                    )}
                </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-600">Overall Score</h3>
                        <Award className="w-5 h-5 text-blue-500" />
                    </div>
                    <p className="mt-2 text-3xl font-bold text-gray-900">
                        {overall_score.toFixed(1)}
                    </p>
                </div>

                {Object.entries(parameter_scores).map(([param, score]) => {
                    const trend = trendData.find(t => t.parameter === param);
                    return (
                        <div key={param} className="bg-white p-6 rounded-lg shadow-md">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-medium text-gray-600">
                                    {param.split('_')[0].toUpperCase()}
                                </h3>
                                {trend && (
                                    trend.change_percentage > 0 ? 
                                        <TrendingUp className="w-5 h-5 text-green-500" /> :
                                        <TrendingDown className="w-5 h-5 text-red-500" />
                                )}
                            </div>
                            <p className="mt-2 text-3xl font-bold text-gray-900">
                                {score.toFixed(1)}
                            </p>
                            {trend && (
                                <p className={`mt-1 text-sm ${
                                    trend.change_percentage > 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                    {trend.change_percentage > 0 ? '+' : ''}
                                    {trend.change_percentage.toFixed(1)}%
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Performance Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Radar Chart */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">
                        Parameter Performance
                    </h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart outerRadius={90} data={parameterComparisons}>
                                <PolarGrid />
                                <PolarAngleAxis dataKey="parameter" />
                                <PolarRadiusAxis domain={[0, 100]} />
                                <Radar
                                    name="Institution Score"
                                    dataKey="institution_score"
                                    stroke="#3b82f6"
                                    fill="#3b82f6"
                                    fillOpacity={0.6}
                                />
                                <Radar
                                    name="Benchmark"
                                    dataKey="benchmark_score"
                                    stroke="#ef4444"
                                    fill="#ef4444"
                                    fillOpacity={0.4}
                                />
                                <Legend />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Improvements Needed */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">
                        Areas for Improvement
                    </h3>
                    <div className="space-y-4">
                        {improvements_needed
                            .sort((a, b) => b.gap - a.gap)
                            .map((improvement) => (
                                <div key={improvement.parameter} className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-gray-600">
                                            {improvement.parameter.split('_')[0].toUpperCase()}
                                        </span>
                                        <span className="text-sm text-gray-600">
                                            Gap: {improvement.gap.toFixed(1)}
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-blue-600 rounded-full h-2"
                                            style={{
                                                width: `${(improvement.current / improvement.target) * 100}%`
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;