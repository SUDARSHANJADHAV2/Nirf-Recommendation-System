import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
    ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { Download, Filter } from 'lucide-react';
import InstitutionComparison from '../components/InstitutionComparison';
import TrendAnalysis from '../components/TrendAnalysis';
import AnalyticsFilter from '../components/AnalyticsFilter';
import { institutionService } from '../services/api';
import * as XLSX from 'xlsx';

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

interface FilterState {
    search: string;
    state: string;
    rankRange: [number, number];
    parameterFocus: keyof Parameters | 'all';
}

const initialFilterState: FilterState = {
    search: '',
    state: '',
    rankRange: [1, 500],
    parameterFocus: 'all'
};

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#8b5cf6', '#f59e0b'];

const Analytics: React.FC = () => {
    const [filters, setFilters] = useState<FilterState>(initialFilterState);
    const [showFilters, setShowFilters] = useState(false);

    const { data: institutions = [], isLoading } = useQuery<Institution[]>({
        queryKey: ['institutions'],
        queryFn: institutionService.getAllInstitutions
    });

    const filteredInstitutions = useMemo(() => {
        return institutions.filter(inst => {
            const matchesSearch = inst.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                                inst.location.state.toLowerCase().includes(filters.search.toLowerCase());
            const matchesState = !filters.state || inst.location.state === filters.state;
            const matchesRank = inst.current_ranking >= filters.rankRange[0] && 
                              inst.current_ranking <= filters.rankRange[1];
            
            return matchesSearch && matchesState && matchesRank;
        });
    }, [institutions, filters]);

    const parameterData = useMemo(() => {
        return filteredInstitutions.slice(0, 10).map(inst => ({
            name: inst.name.substring(0, 20) + (inst.name.length > 20 ? '...' : ''),
            TLR: inst.parameters.tlr_score,
            RPC: inst.parameters.rpc_score,
            GO: inst.parameters.go_score,
            OI: inst.parameters.oi_score,
            Perception: inst.parameters.perception_score
        }));
    }, [filteredInstitutions]);

    const stateDistribution = useMemo(() => {
        const distribution = institutions.reduce((acc, inst) => {
            acc[inst.location.state] = (acc[inst.location.state] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(distribution)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10); // Show top 10 states only
    }, [institutions]);

    const handleExportData = () => {
        const exportData = filteredInstitutions.map(inst => ({
            'Institution Name': inst.name,
            'Ranking': inst.current_ranking,
            'State': inst.location.state,
            'City': inst.location.city,
            'TLR Score': inst.parameters.tlr_score,
            'Research Score': inst.parameters.rpc_score,
            'Graduation Outcomes': inst.parameters.go_score,
            'Outreach': inst.parameters.oi_score,
            'Perception': inst.parameters.perception_score
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'NIRF Analysis');
        XLSX.writeFile(wb, 'nirf_analysis.xlsx');
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-lg text-gray-600">Loading analytics data...</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header Section */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Performance Analytics</h1>
                    <p className="text-gray-600 mt-2">Comprehensive analysis of NIRF parameters and trends</p>
                </div>
                <div className="flex space-x-4">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                        <Filter className="w-4 h-4 mr-2" />
                        Filters
                    </button>
                    <button
                        onClick={handleExportData}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Export Data
                    </button>
                </div>
            </div>

            {/* Filter Section */}
            {showFilters && (
                <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                    <AnalyticsFilter
                        filters={filters}
                        states={Array.from(new Set(institutions.map(inst => inst.location.state))).sort()}
                        onFilterChange={(key, value) => setFilters(prev => ({ ...prev, [key]: value }))}
                    />
                </div>
            )}

            {/* Trend Analysis */}
            <div className="mb-8">
                <TrendAnalysis institutions={filteredInstitutions} />
            </div>

            {/* Main Analytics Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Parameter Analysis Chart */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-lg font-semibold text-gray-700 mb-4">Parameter Analysis</h2>
                    <div className="h-96">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={parameterData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="TLR" fill={COLORS[0]} name="Teaching & Learning" />
                                <Bar dataKey="RPC" fill={COLORS[1]} name="Research" />
                                <Bar dataKey="GO" fill={COLORS[2]} name="Graduation Outcomes" />
                                <Bar dataKey="OI" fill={COLORS[3]} name="Outreach" />
                                <Bar dataKey="Perception" fill={COLORS[4]} name="Perception" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* State Distribution */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-lg font-semibold text-gray-700 mb-4">Geographic Distribution</h2>
                    <div className="h-96">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stateDistribution}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={130}
                                    label
                                >
                                    {stateDistribution.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Institution Comparison */}
            <div className="mt-8">
                <InstitutionComparison institutions={filteredInstitutions} />
            </div>
        </div>
    );
};

export default Analytics;