import React, { useState } from 'react';
import { Search } from 'lucide-react';

interface InstitutionFilterProps {
    onSearch: (searchTerm: string) => void;
    onRankingFilter: (range: [number, number]) => void;
    onStateFilter: (state: string) => void;
    states: string[];
}

const InstitutionFilter: React.FC<InstitutionFilterProps> = ({
    onSearch,
    onRankingFilter,
    onStateFilter,
    states
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [rankRange, setRankRange] = useState<[number, number]>([1, 500]);
    const [selectedState, setSelectedState] = useState<string>('');

    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setSearchTerm(value);
        onSearch(value);
    };

    const handleRankingChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const value = event.target.value;
        let range: [number, number] = [1, 500];
        
        switch(value) {
            case 'top100':
                range = [1, 100];
                break;
            case 'top200':
                range = [1, 200];
                break;
            case 'top500':
                range = [1, 500];
                break;
        }
        
        setRankRange(range);
        onRankingFilter(range);
    };

    const handleStateChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const value = event.target.value;
        setSelectedState(value);
        onStateFilter(value);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search Input */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search institutions..."
                        value={searchTerm}
                        onChange={handleSearch}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                {/* Ranking Filter */}
                <div>
                    <select
                        onChange={handleRankingChange}
                        className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="all">All Rankings</option>
                        <option value="top100">Top 100</option>
                        <option value="top200">Top 200</option>
                        <option value="top500">Top 500</option>
                    </select>
                </div>

                {/* State Filter */}
                <div>
                    <select
                        value={selectedState}
                        onChange={handleStateChange}
                        className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">All States</option>
                        {states.map(state => (
                            <option key={state} value={state}>
                                {state}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
};

export default InstitutionFilter;