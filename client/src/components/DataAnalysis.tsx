import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DataAnalysisProps {
  institutionData: any;  // We'll refine this type later
  isLoading: boolean;
}

const DataAnalysis: React.FC<DataAnalysisProps> = ({ institutionData, isLoading }) => {
  const parameterData = [
    { name: 'TLR', value: institutionData?.parameters?.tlr_score || 0 },
    { name: 'RPC', value: institutionData?.parameters?.rpc_score || 0 },
    { name: 'GO', value: institutionData?.parameters?.go_score || 0 },
    { name: 'OI', value: institutionData?.parameters?.oi_score || 0 },
    { name: 'Perception', value: institutionData?.parameters?.perception_score || 0 }
  ];

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-lg font-semibold text-gray-700 mb-4">Parameter Analysis</h2>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={parameterData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#3b82f6" name="Score" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <ParameterCard
          title="Teaching & Learning Resources"
          value={institutionData?.parameters?.tlr_score}
          metrics={[
            {
              label: "Faculty Ratio",
              value: institutionData?.metrics?.teaching_metrics?.faculty_ratio
            },
            {
              label: "PhD Faculty",
              value: institutionData?.metrics?.teaching_metrics?.faculty_qualification?.phd_percentage
            }
          ]}
        />
        <ParameterCard
          title="Research & Professional Practice"
          value={institutionData?.parameters?.rpc_score}
          metrics={[
            {
              label: "Publications",
              value: institutionData?.metrics?.research_metrics?.publications?.count
            },
            {
              label: "Patents",
              value: institutionData?.metrics?.research_metrics?.patents?.granted
            }
          ]}
        />
      </div>
    </div>
  );
};

interface ParameterCardProps {
  title: string;
  value: number;
  metrics: Array<{
    label: string;
    value: number;
  }>;
}

const ParameterCard: React.FC<ParameterCardProps> = ({ title, value, metrics }) => {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-700">{title}</h3>
        <span className="text-lg font-bold text-blue-600">{value?.toFixed(1)}</span>
      </div>
      <div className="space-y-2">
        {metrics.map((metric, index) => (
          <div key={index} className="flex justify-between text-sm">
            <span className="text-gray-600">{metric.label}</span>
            <span className="font-medium">{metric.value?.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DataAnalysis;         