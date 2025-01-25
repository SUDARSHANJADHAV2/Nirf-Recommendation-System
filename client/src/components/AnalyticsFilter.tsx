import React from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';

interface FilterProps {
    filters: {
        search: string;
        state: string;
        rankRange: [number, number];
        parameterFocus: string;
    };
    states: string[];
    onFilterChange: (key: string, value: any) => void;
}

const AnalyticsFilter: React.FC<FilterProps> = ({ filters, states, onFilterChange }) => {
    const rankRanges = [
        { label: 'All Institutions', value: [1, 500] as [number, number] },
        { label: 'Top 50', value: [1, 50] as [number, number] },
        { label: 'Top 100', value: [1, 100] as [number, number] },
        { label: 'Top 200', value: [1, 200] as [number, number] }
    ];

    const parameters = [
        { label: 'All Parameters', value: 'all' },
        { label: 'Teaching & Learning', value: 'tlr_score' },
        { label: 'Research & Professional Practice', value: 'rpc_score' },
        { label: 'Graduation Outcomes', value: 'go_score' },
        { label: 'Outreach & Inclusivity', value: 'oi_score' },
        { label: 'Perception', value: 'perception_score' }
    ];

    return (
        <div className="space-y-4">
            <div className="flex items-center space-x-2 text-gray-700 mb-4">
                <SlidersHorizontal className="w-5 h-5" />
                <span className="font-medium">Filter Analytics</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search Input */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        value={filters.search}
                        onChange={(e) => onFilterChange('search', e.target.value)}
                        placeholder="Search institutions..."
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                {/* State Filter */}
                <select
                    value={filters.state}
                    onChange={(e) => onFilterChange('state', e.target.value)}
                    className="block w-full py-2 px-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="">All States</option>
                    {states.map(state => (
                        <option key={state} value={state}>{state}</option>
                    ))}
                </select>

                {/* Rank Range Filter */}
                <select
                    value={JSON.stringify(filters.rankRange)}
                    onChange={(e) => onFilterChange('rankRange', JSON.parse(e.target.value))}
                    className="block w-full py-2 px-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                    {rankRanges.map(range => (
                        <option key={range.label} value={JSON.stringify(range.value)}>
                            {range.label}
                        </option>
                    ))}
                </select>

                {/* Parameter Focus Filter */}
                <select
                    value={filters.parameterFocus}
                    onChange={(e) => onFilterChange('parameterFocus', e.target.value)}
                    className="block w-full py-2 px-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                    {parameters.map(param => (
                        <option key={param.value} value={param.value}>
                            {param.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Active Filters Display */}
            <div className="flex flex-wrap gap-2 mt-4">
                {filters.search && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                        Search: {filters.search}
                        <button
                            onClick={() => onFilterChange('search', '')}
                            className="ml-2 focus:outline-none"
                        >
                            ×
                        </button>
                    </span>
                )}
                {filters.state && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                        State: {filters.state}
                        <button
                            onClick={() => onFilterChange('state', '')}
                            className="ml-2 focus:outline-none"
                        >
                            ×
                        </button>
                    </span>
                )}
                {filters.parameterFocus !== 'all' && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
                        Focus: {parameters.find(p => p.value === filters.parameterFocus)?.label}
                        <button
                            onClick={() => onFilterChange('parameterFocus', 'all')}
                            className="ml-2 focus:outline-none"
                        >
                            ×
                        </button>
                    </span>
                )}
            </div>
        </div>
    );
};

export default AnalyticsFilter;