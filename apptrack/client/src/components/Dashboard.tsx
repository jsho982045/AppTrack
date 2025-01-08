// client/src/components/Dashboard.tsx
import { useState, useEffect } from 'react';
import { JobApplication } from '../types';
import { createApplication, fetchApplications, deleteApplication, updateApplication } from '../services/api';
import AddApplicationModal from './AddApplicationModal';
import EditApplicationModal from './EditApplicationModal';
import ApplicationTable from './ApplicationTable';

const Dashboard = () => {
    const [applications, setApplications] = useState<JobApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const[isEditModalOpen, setIsEditModalOpen] = useState(false);
    const[currentApplication, setCurrentApplication] = useState<JobApplication | null>(null);

    const handleAddApplication = async (newApplication: Omit<JobApplication, '_id'>) => {
        try{
            const createdApplication = await createApplication(newApplication);
            setApplications(prev => [...prev, createdApplication]);
            setIsModalOpen(false);
        }catch(err){
            setError('Failed to add application');
            console.error('Error adding application:', err);
        }
    };

    const handleDeleteApplication = async (id: string) => {
        try {
            await deleteApplication(id);
            setApplications(prev => prev.filter(app => app._id !== id));
        } catch(err) {
            setError('Failed to delete application');
            console.error('Error deleting applications:', err);
        } 
    };

    const handleEditApplication = (application: JobApplication) => {
        setCurrentApplication(application);
        setIsEditModalOpen(true);
    };

    const handleUpdateApplication = async (updatedApplication: JobApplication) => {
        try{
            const updated = await updateApplication(updatedApplication._id!, updatedApplication);
            setApplications(prev => prev.map(app => 
                app._id === updated._id ? updated : app
            ));
            setIsEditModalOpen(false);
        } catch (err) {
            setError('Failed to update Application');
            console.error('Error updating applications:', err);
        }
    };

   

    useEffect(() => {
        const loadApplications = async () => {
            try {
                const data = await fetchApplications();
                setApplications(data);
            } catch (err) {
                setError('Failed to load applications');
                console.error('Error loading applications:', err);
            } finally {
                setLoading(false);
            }
        };

        loadApplications();
    }, []);

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Job Applications Dashboard
                    </h1>
                    <div className="spacex-4">
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                        Add Application
                    </button>
                </div>
            </div>

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

                    {!loading && !error && applications.length > 0 && (
                        <ApplicationTable 
                            applications={applications} 
                            onDelete={handleDeleteApplication}
                            onEdit={handleEditApplication}
                        />
                        
                    )}
                </div>

                <AddApplicationModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSubmit={handleAddApplication}
                />

                {currentApplication && (
                    <EditApplicationModal
                        isOpen={isEditModalOpen}
                        onClose={() => setIsEditModalOpen(false)}
                        onSubmit={handleUpdateApplication}
                        application={currentApplication}
                    />
                )}
            </div>
        </div>
    );
};

export default Dashboard;