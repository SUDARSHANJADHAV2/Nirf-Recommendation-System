import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { institutionService } from '../services/api';

interface Recommendation {
  parameter: string;
  current_score: number;
  target_score: number;
  improvement_needed: number;
  priority: 'High' | 'Medium' | 'Low';
  suggestions: string[];
}

interface RecommendationsResponse {
  institution_name: string;
  current_ranking: number;
  recommendations: Recommendation[];
}

const RecommendationsList: React.FC<{ institutionId: string }> = ({ institutionId }) => {
  const { data, isLoading } = useQuery<RecommendationsResponse>({
    queryKey: ['recommendations', institutionId],
    queryFn: () => institutionService.getRecommendations(institutionId)
  });

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">
        Improvement Recommendations
      </h3>
      <div className="space-y-6">
        {data?.recommendations.map((rec) => (
          <div key={rec.parameter} className="border-b border-gray-100 pb-4 last:border-0">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-800">{rec.parameter}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                rec.priority === 'High' 
                  ? 'bg-red-100 text-red-800' 
                  : rec.priority === 'Medium'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                {rec.priority} Priority
              </span>
            </div>
            <div className="flex items-center mb-3">
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Current: {rec.current_score.toFixed(1)}</span>
                  <span className="text-sm text-gray-600">Target: {rec.target_score.toFixed(1)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${(rec.current_score / rec.target_score) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <ul className="list-disc list-inside space-y-1">
              {rec.suggestions.map((suggestion, index) => (
                <li key={index} className="text-sm text-gray-600">
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecommendationsList;