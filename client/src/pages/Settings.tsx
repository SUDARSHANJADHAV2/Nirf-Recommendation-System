import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Settings as SettingsIcon, Save, Bell, Building, Mail } from 'lucide-react';
import { institutionService } from '../services/api';
import { Institution } from '../types';

// Interface to define the structure of our settings form
interface SettingsForm {
    institutionProfile: {
        name: string;
        instituteCode: string;
        email: string;
        state: string;
        city: string;
        website: string;
    };
    notifications: {
        emailAlerts: boolean;
        rankingUpdates: boolean;
        recommendationAlerts: boolean;
        monthlyReports: boolean;
    };
    analysisPreferences: {
        benchmarkInstitutions: string[];
        focusParameters: string[];
        reportPeriodicity: 'weekly' | 'monthly' | 'quarterly';
    };
}

const Settings: React.FC = () => {
    // Initialize form state with default values
    const [formData, setFormData] = useState<SettingsForm>({
        institutionProfile: {
            name: '',
            instituteCode: '',
            email: '',
            state: '',
            city: '',
            website: ''
        },
        notifications: {
            emailAlerts: true,
            rankingUpdates: true,
            recommendationAlerts: true,
            monthlyReports: false
        },
        analysisPreferences: {
            benchmarkInstitutions: [],
            focusParameters: ['tlr_score', 'rpc_score', 'go_score'],
            reportPeriodicity: 'monthly'
        }
    });

    // Fetch existing settings if available
    const { data: existingSettings, isLoading } = useQuery({
        queryKey: ['settings'],
        queryFn: institutionService.getSettings
    });

    // Fetch all institutions for benchmark selection
    const { data: institutions = [] } = useQuery<Institution[]>({
        queryKey: ['institutions'],
        queryFn: institutionService.getAllInstitutions
    });

    // Save settings mutation
    const saveSettingsMutation = useMutation({
        mutationFn: (settings: SettingsForm) => institutionService.saveSettings(settings),
        onSuccess: () => {
            // Show success message
            alert('Settings saved successfully');
        }
    });

    // Update form when existing settings are loaded
    useEffect(() => {
        if (existingSettings) {
            setFormData(existingSettings);
        }
    }, [existingSettings]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        saveSettingsMutation.mutate(formData);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-lg text-gray-600">Loading settings...</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
                <p className="text-gray-600 mt-2">
                    Configure your institution profile and analysis preferences
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Institution Profile Section */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex items-center mb-6">
                        <Building className="w-6 h-6 text-blue-600 mr-2" />
                        <h2 className="text-lg font-semibold text-gray-700">
                            Institution Profile
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Institution Name
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.institutionProfile.name}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    institutionProfile: {
                                        ...formData.institutionProfile,
                                        name: e.target.value
                                    }
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                NIRF Institute Code
                            </label>
                            <input
                                type="text"
                                name="instituteCode"
                                value={formData.institutionProfile.instituteCode}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    institutionProfile: {
                                        ...formData.institutionProfile,
                                        instituteCode: e.target.value
                                    }
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Add more profile fields here... */}
                    </div>
                </div>

                {/* Notification Preferences */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex items-center mb-6">
                        <Bell className="w-6 h-6 text-blue-600 mr-2" />
                        <h2 className="text-lg font-semibold text-gray-700">
                            Notification Preferences
                        </h2>
                    </div>

                    <div className="space-y-4">
                        {Object.entries(formData.notifications).map(([key, value]) => (
                            <div key={key} className="flex items-center">
                                <input
                                    type="checkbox"
                                    id={key}
                                    name={key}
                                    checked={value}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        notifications: {
                                            ...formData.notifications,
                                            [key]: e.target.checked
                                        }
                                    })}
                                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                />
                                <label htmlFor={key} className="ml-2 text-gray-700">
                                    {key.split(/(?=[A-Z])/).join(' ')}
                                </label>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                    <button
                        type="submit"
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        Save Settings
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Settings;