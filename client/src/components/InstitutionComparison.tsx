import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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

interface InstitutionComparisonProps {
    institutions: Institution[];
}

const InstitutionComparison: React.FC<InstitutionComparisonProps> = ({ institutions }) => {
    const [selectedInstitutions, setSelectedInstitutions] = useState<string[]>([]);

    const handleInstitutionSelect = (institutionId: string) => {
        if (selectedInstitutions.includes(institutionId)) {
            setSelectedInstitutions(prev => prev.filter(id => id !== institutionId));
        } else if (selectedInstitutions.length < 3) {
            setSelectedInstitutions(prev => [...prev, institutionId]);
        }
    };

    const selectedInstitutionsData = selectedInstitutions.map(id => 
        institutions.find(inst => inst.institute_id === id)
    ).filter((inst): inst is Institution => inst !== undefined);

    const comparisonData = [
        { parameter: 'TLR', ...Object.fromEntries(selectedInstitutionsData.map(inst => [inst.name, inst.parameters.tlr_score])) },
        { parameter: 'RPC', ...Object.fromEntries(selectedInstitutionsData.map(inst => [inst.name, inst.parameters.rpc_score])) },
        { parameter: 'GO', ...Object.fromEntries(selectedInstitutionsData.map(inst => [inst.name, inst.parameters.go_score])) },
        { parameter: 'OI', ...Object.fromEntries(selectedInstitutionsData.map(inst => [inst.name, inst.parameters.oi_score])) },
        { parameter: 'Perception', ...Object.fromEntries(selectedInstitutionsData.map(inst => [inst.name, inst.parameters.perception_score])) }
    ];

    const colors = ['#3b82f6', '#ef4444', '#10b981'];

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Institution Comparison</h2>
            
            {/* Institution Selection */}
            <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Select Institutions to Compare (max 3)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {institutions.slice(0, 9).map((institution) => (
                        <button
                            key={institution.institute_id}
                            onClick={() => handleInstitutionSelect(institution.institute_id)}
                            className={`p-3 rounded-lg border text-left ${
                                selectedInstitutions.includes(institution.institute_id)
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-blue-300'
                            }`}
                        >
                            <div className="font-medium">{institution.name}</div>
                            <div className="text-sm text-gray-600">Rank: {institution.current_ranking}</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Comparison Chart */}
            {selectedInstitutions.length > 0 && (
                <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={comparisonData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="parameter" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            {selectedInstitutionsData.map((inst, index) => (
                                <Bar
                                    key={inst.institute_id}
                                    dataKey={inst.name}
                                    fill={colors[index]}
                                />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
};

export default InstitutionComparison;