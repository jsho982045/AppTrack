import { useState, useEffect } from 'react';
import { JobApplication } from '../types';
import { fetchApplications } from '../services/api';

const Dashboard = () => {

    const [applications, setApplications] = useState<JobApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    
    useEffect(() => {
        const loadApplications = async () => {
            try{
                const data = await fetchApplications();
                setApplications(data);
            }catch(err) {
                setError('Failed to load applications');
                console.error('Error loading applications:', err);
            }finally {
                setLoading(false);
            }
        };

        loadApplications();
    }, []);

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">
                    Job Applications Dashboard
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-medium text-gray-900">Total Applications</h3>
                        <p className="text-2xl font-bold text-blue-600">{applications.length}</p>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-medium text-gray-900">In Progress</h3>
                        <p className="text-2xl font-bold text-yellow-600">
                            {applications.filter(app => app.status === 'interviewing').length}
                        </p>
                    </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium text-gray-900">Responses</h3>
                    <p className="text-2xl font-bold text-green-600">
                        {applications.filter(app => app.status !== 'applied').length}
                    </p>
                </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Recent Applications</h2>
                {loading && <div className="text-center py-4">Loading...</div>}

                {error && (
                    <div className="text-red-600 text-center py-4">
                        {error}
                    </div>
                )}

                {!loading && !error && applications.length === 0 && (
                    <div className="text-gray-500 text-center py-8">
                        No applications yet
                        </div>
                )}

                {applications.map(app => (
                    <div
                    key={app._id}
                    className="border-b border-gray-200 py-4 last:border-0"
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-medium">{app.company}</h3>
                                <p className="text-gray-600">{app.position}</p>
                                <p className="text-sm text-gray-500">
                                    Applied: {new Date(app.dateApplied).toLocaleDateString()}
                                </p>
                            </div>
                            <span className={`
                                px-2 py-1 rounded-full text-sm
                                ${app.status === 'applied' ? 'bg-blue-100 text-blue-800' : ''}
                                ${app.status === 'interviewing' ? 'bg-yellow-100 text-yellow-800' : ''}
                                ${app.status === 'rejected' ? 'bg-red-100 text-red-800' : ''}
                                ${app.status === 'accepted' ? 'bg-green-100 text-green-800' : ''}
                                `}>
                                    {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                                </span>
                            </div>
                        </div>
                ))}
            </div>
        </div>
    </div>
    );
};

export default Dashboard;