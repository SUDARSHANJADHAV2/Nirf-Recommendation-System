import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
    Download, FileText, Calendar, Filter,
    TrendingUp, AlertCircle 
} from 'lucide-react';
import { institutionService } from '../services/api';
import { Institution, Parameters } from '../types';
import * as XLSX from 'xlsx';

// Define TypeScript interfaces for our component's types
interface DateRange {
    startDate: string;
    endDate: string;
}

interface ReportOptions {
    dateRange: DateRange;
    parameters: (keyof Parameters)[];
    compareWithBenchmark: boolean;
    includeRecommendations: boolean;
    format: 'xlsx' | 'pdf';
}

// Define our parameter keys as a constant array for type safety
const PARAMETER_KEYS: (keyof Parameters)[] = [
    'tlr_score',
    'rpc_score',
    'go_score',
    'oi_score',
    'perception_score'
];

const Reports: React.FC = () => {
    // Initialize state with default report options
    const [reportOptions, setReportOptions] = useState<ReportOptions>({
        dateRange: {
            startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0]
        },
        parameters: PARAMETER_KEYS,
        compareWithBenchmark: true,
        includeRecommendations: true,
        format: 'xlsx'
    });

    // Fetch institutions data using React Query
    const { data: institutions = [], isLoading } = useQuery<Institution[]>({
        queryKey: ['institutions'],
        queryFn: institutionService.getAllInstitutions
    });

    // Calculate report metrics using useMemo for performance optimization
    const reportMetrics = useMemo(() => {
        if (!institutions.length) return null;

        // Calculate average scores across all institutions
        const averages = institutions.reduce((acc, inst) => {
            return PARAMETER_KEYS.reduce((paramAcc, param) => ({
                ...paramAcc,
                [param]: ((paramAcc as Record<keyof Parameters, number>)[param] || 0) + inst.parameters[param]
            }), {
                ...acc,
                count: acc.count + 1
            });
        }, { count: 0, ...Object.fromEntries(PARAMETER_KEYS.map(key => [key, 0])) } as Record<keyof Parameters | 'count', number>);

        // Calculate trends and identify areas needing attention
        const trends = PARAMETER_KEYS.map(param => {
            const scores = institutions.map(inst => inst.parameters[param]);
            const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
            const improvement = scores.length > 1 
                ? ((scores[scores.length - 1] - scores[0]) / scores[0]) * 100 
                : 0;

            return {
                parameter: param,
                average: avg,
                trend: improvement,
                needsAttention: avg < 70
            };
        });

        return { averages, trends };
    }, [institutions]);

    // Function to generate and download the Excel report
    const generateReport = () => {
        if (!reportMetrics) return;

        // Prepare data for the report
        const reportData = institutions.map(inst => {
            // Base data for each institution
            const baseData: Record<string, any> = {
                'Institution Name': inst.name,
                'Current Ranking': inst.current_ranking,
                'Location': `${inst.location.city}, ${inst.location.state}`
            };

            // Add selected parameter scores
            reportOptions.parameters.forEach(param => {
                baseData[param.toUpperCase()] = inst.parameters[param];
                
                // Add benchmark comparison if selected
                if (reportOptions.compareWithBenchmark) {
                    const avgScore = reportMetrics.averages[param] / reportMetrics.averages.count;
                    baseData[`${param.toUpperCase()} vs Benchmark`] = 
                        inst.parameters[param] - avgScore;
                }
            });

            return baseData;
        });

        // Create and configure Excel workbook
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(reportData);

        // Add column formatting
        const colWidths = Object.keys(reportData[0]).map(() => ({ wch: 20 }));
        ws['!cols'] = colWidths;

        // Add the worksheet to workbook and download
        XLSX.utils.book_append_sheet(wb, ws, 'NIRF Analysis');
        XLSX.writeFile(wb, `NIRF_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    // Loading state handler
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-lg text-gray-600">Loading report data...</div>
            </div>
        );
    }

    // Main render
    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header Section */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
                    <p className="text-gray-600 mt-2">
                        Generate comprehensive analysis reports and track progress
                    </p>
                </div>
                <button
                    onClick={generateReport}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Generate Report
                </button>
            </div>

            {/* Report Configuration Section */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Date Range Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Date Range
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <input
                                type="date"
                                value={reportOptions.dateRange.startDate}
                                onChange={(e) => setReportOptions(prev => ({
                                    ...prev,
                                    dateRange: {
                                        ...prev.dateRange,
                                        startDate: e.target.value
                                    }
                                }))}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                            <input
                                type="date"
                                value={reportOptions.dateRange.endDate}
                                onChange={(e) => setReportOptions(prev => ({
                                    ...prev,
                                    dateRange: {
                                        ...prev.dateRange,
                                        endDate: e.target.value
                                    }
                                }))}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                        </div>
                    </div>

                    {/* Parameter Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Include Parameters
                        </label>
                        <div className="space-y-2">
                            {PARAMETER_KEYS.map((param) => (
                                <div key={param} className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id={param}
                                        checked={reportOptions.parameters.includes(param)}
                                        onChange={(e) => {
                                            const updatedParameters = e.target.checked
                                                ? [...reportOptions.parameters, param]
                                                : reportOptions.parameters.filter(p => p !== param);
                                            setReportOptions(prev => ({
                                                ...prev,
                                                parameters: updatedParameters
                                            }));
                                        }}
                                        className="h-4 w-4 text-blue-600 rounded"
                                    />
                                    <label htmlFor={param} className="ml-2 text-sm text-gray-700">
                                        {param.split('_')[0].toUpperCase()}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Additional Options */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Report Options
                        </label>
                        <div className="space-y-2">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="compareWithBenchmark"
                                    checked={reportOptions.compareWithBenchmark}
                                    onChange={(e) => setReportOptions(prev => ({
                                        ...prev,
                                        compareWithBenchmark: e.target.checked
                                    }))}
                                    className="h-4 w-4 text-blue-600 rounded"
                                />
                                <label htmlFor="compareWithBenchmark" className="ml-2 text-sm text-gray-700">
                                    Include Benchmark Comparison
                                </label>
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="includeRecommendations"
                                    checked={reportOptions.includeRecommendations}
                                    onChange={(e) => setReportOptions(prev => ({
                                        ...prev,
                                        includeRecommendations: e.target.checked
                                    }))}
                                    className="h-4 w-4 text-blue-600 rounded"
                                />
                                <label htmlFor="includeRecommendations" className="ml-2 text-sm text-gray-700">
                                    Include Recommendations
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Report Preview Section */}
            {reportMetrics && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Overview Section */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4">Report Overview</h3>
                        <div className="space-y-4">
                            {reportMetrics.trends.map((trend) => (
                                <div key={trend.parameter} className="flex items-center justify-between">
                                    <span className="text-gray-600">{trend.parameter.split('_')[0].toUpperCase()}</span>
                                    <div className="flex items-center">
                                        <span className={`font-medium ${
                                            trend.trend > 0 ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                            {trend.trend > 0 ? '+' : ''}{trend.trend.toFixed(1)}%
                                        </span>
                                        {trend.needsAttention && (
                                            <AlertCircle className="w-4 h-4 text-yellow-500 ml-2" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Summary Statistics */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4">Summary Statistics</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <div className="text-sm text-gray-600">Institutions Analyzed</div>
                                <div className="text-2xl font-semibold text-gray-900">
                                    {institutions.length}
                                </div>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <div className="text-sm text-gray-600">Parameters Tracked</div>
                                <div className="text-2xl font-semibold text-gray-900">
                                    {reportOptions.parameters.length}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reports;