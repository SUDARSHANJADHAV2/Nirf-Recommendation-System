import React, { useState } from 'react';
import axios from 'axios';

const DataImport: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage('Please select a file first');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/api/v1/data/import-excel', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setMessage('Data imported successfully!');
    } catch (error) {
      setMessage('Error importing data. Please try again.');
      console.error('Upload error:', error);
    }
    setLoading(false);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-lg font-semibold text-gray-700 mb-4">Import NIRF Data</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Excel File
          </label>
          <input
            type="file"
            accept=".xlsx"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
        </div>

        <button
          onClick={handleUpload}
          disabled={loading || !file}
          className={`w-full px-4 py-2 text-white rounded-md ${
            loading || !file 
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Importing...' : 'Import Data'}
        </button>

        {message && (
          <div className={`p-4 rounded-md ${
            message.includes('success')
              ? 'bg-green-50 text-green-800'
              : 'bg-red-50 text-red-800'
          }`}>
            {message}
          </div>
        )}
      </div>

      <div className="mt-6 text-sm text-gray-600">
        <h3 className="font-semibold mb-2">Instructions:</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>Upload the NIRF data Excel file (.xlsx format)</li>
          <li>File should contain all required NIRF parameters</li>
          <li>Make sure the data format matches the NIRF template</li>
          <li>Wait for the import process to complete</li>
        </ul>
      </div>
    </div>
  );
};

export default DataImport;
