import React from 'react';
import DataImport from '../components/DataImport';
import DataAnalysis from '../components/DataAnalysis';
import { useQuery } from '@tanstack/react-query';
import { institutionService } from '../services/api';

const DataManagement: React.FC = () => {
  const { data: statistics, isLoading: statsLoading } = useQuery({
    queryKey: ['dataStatistics'],
    queryFn: institutionService.getDataStatistics
  });

  const { data: institutionData, isLoading: dataLoading } = useQuery({
    queryKey: ['institutionData'],
    queryFn: () => institutionService.getAllInstitutions()
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Data Management</h1>

      <div className="grid grid-cols-1 gap-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <DataImport />

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Data Statistics</h2>
            
            {statsLoading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-gray-600">Total Institutions</span>
                  <span className="font-semibold">{statistics?.totalInstitutions}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-gray-600">Last Updated</span>
                  <span className="font-semibold">
                    {new Date(statistics?.lastUpdated).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Data Version</span>
                  <span className="font-semibold">{statistics?.dataVersion}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {institutionData && institutionData.length > 0 && (
          <DataAnalysis 
            institutionData={institutionData[0]} 
            isLoading={dataLoading} 
          />
        )}
      </div>
    </div>
  );
};

export default DataManagement;