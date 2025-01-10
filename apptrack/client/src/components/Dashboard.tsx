// client/src/components/Dashboard.tsx
import { useState, useEffect } from 'react';
import { JobApplication } from '../types';
import { createApplication, fetchApplications, deleteApplication, updateApplication } from '../services/api';
import AddApplicationModal from './AddApplicationModal';
import EditApplicationModal from './EditApplicationModal';
import ApplicationTable from './ApplicationTable';
import ApplicationSearch from './ApplicationSearch';

const Dashboard = () => {
    const [applications, setApplications] = useState<JobApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const[isEditModalOpen, setIsEditModalOpen] = useState(false);
    const[currentApplication, setCurrentApplication] = useState<JobApplication | null>(null);
    const [filteredApplications, setFilteredApplications] = useState<JobApplication[]>([]);


    const handleAddApplication = async (newApplication: Omit<JobApplication, '_id'>) => {
        try {
            const createdApplication = await createApplication(newApplication);
            setApplications((prev) => 
                [createdApplication, ...prev].sort((a, b) =>
                    new Date(b.dateApplied).getTime() - new Date(a.dateApplied).getTime()
                )
            ); 
            setIsModalOpen(false);
        } catch (err) {
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
        setFilteredApplications(applications);
    }, [applications]);

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
            <div className="w-full px-6 py-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Job Applications Dashboard
                    </h1>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                        Add Application
                    </button>
                </div>

                <div className="grid grid-cols-3 gap-6 mb-6">
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="text-sm font-medium text-gray-700">Total Applications</h3>
                        <p className="text-xl font-bold text-blue-600">{filteredApplications.length}</p>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="text-sm font-medium text-gray-700">In Progress</h3>
                        <p className="text-xl font-bold text-yellow-600">
                            {filteredApplications.filter(app => app.status === 'interviewing').length}
                        </p>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="text-sm font-medium text-gray-700">Responses</h3>
                        <p className="text-2xl font-bold text-green-600">
                            {filteredApplications.filter(app => app.status !== 'applied').length}
                        </p>
                    </div>
                </div>

                <div className="bg-white shadow rounded-lg">
                    <div className='p-4 border-b'>
                        <h2 className="text-lg font-semibold">Recent Applications</h2>
                    </div>
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
                        <>
                            <div className="px-4">
                                <ApplicationSearch
                                    applications={applications}
                                    onFilter={setFilteredApplications}
                                />
                            </div>
                            <div className='overflow-x-auto'>
                                <ApplicationTable 
                                    applications={filteredApplications} 
                                    onDelete={handleDeleteApplication}
                                    onEdit={handleEditApplication}
                                />
                            </div>
                        </>
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