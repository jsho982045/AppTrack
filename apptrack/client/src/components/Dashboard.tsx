// client/src/components/Dashboard.tsx
import { JobApplication } from '../types';
import { useState, useEffect } from 'react';
import Navbar from './Navbar';
import ApplicationTable from './ApplicationTable';
import ApplicationSearch from './ApplicationSearch';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import AddApplicationModal from './AddApplicationModal';
import EditApplicationModal from './EditApplicationModal';
import { createApplication, fetchApplications, deleteApplication, updateApplication } from '../services/api';
import { ClipboardList, HourglassIcon, InboxIcon, PlusIcon } from 'lucide-react';

const Dashboard = () => {
    const [applications, setApplications] = useState<JobApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const[isEditModalOpen, setIsEditModalOpen] = useState(false);
    const[currentApplication, setCurrentApplication] = useState<JobApplication | null>(null);
    const [filteredApplications, setFilteredApplications] = useState<JobApplication[]>([]);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [applicationToDelete, setApplicationToDelete] = useState<JobApplication | null>(null);


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
        
        const application = applications.find(app => app._id === id);
        setApplicationToDelete(application || null);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!applicationToDelete?._id) return;

        try {
            await deleteApplication(applicationToDelete._id);
            setApplications(prev => prev.filter(app => app._id !== applicationToDelete._id));
            
            const event = new CustomEvent('applicationDeleted');
            window.dispatchEvent(event);
            
            setIsDeleteModalOpen(false);
            setApplicationToDelete(null);
        } catch(err) {
            setError('Failed to delete application');
            console.error('Error deleting application:', err);
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

    const triggerDataMigration = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/dev/migrate-data`, {
                method: 'POST',
                credentials: 'include'  // Important for sending cookies
            });
            const data = await response.json();
            console.log('Migration result:', data);
            // Reload applications after migration
            const updatedApplications = await fetchApplications();
            setApplications(updatedApplications);
        } catch (error) {
            console.error('Migration failed:', error);
        }
    };

    const handleClearAllData = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/collections/clear`, {
                method: 'POST',
                credentials: 'include'
            });
            if (response.ok) {
                // Refresh applications list
                const data = await fetchApplications();
                setApplications(data);
            }
        } catch (error) {
            console.error('Failed to clear data:', error);
            setError('Failed to clear data');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <Navbar />
            
            {/* Main container with max width and padding */}
            <div style={{ width: 'min(95vw, 1600px)' }} className="mx-auto py-6 px-4">
                {/* Header section with title and actions */}
                <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                            AppTrack
                        </h1>
                        <p className="text-gray-600 mt-1">Track and manage your job applications</p>
                    </div>
                    <div className="flex space-x-3">
                        <button
                            onClick={handleClearAllData}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                        >
                            Clear Data
                        </button>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 flex items-center space-x-2"
                        >
                            <PlusIcon className="w-4 h-4" />
                            <span>Add Application</span>
                        </button>
                    </div>
                </div>
    
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6">
                    {/* Total Applications Card */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300">
                        <div className="flex flex-col space-y-2">
                            <h3 className="text-sm font-medium text-gray-600">Total Applications</h3>
                            <div className="flex items-center justify-between">
                                <span className="text-3xl font-bold text-blue-600">
                                    {filteredApplications.length}
                                </span>
                                <div className="bg-blue-50 p-3 rounded-full">
                                    <ClipboardList className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                        </div>
                    </div>
    
                    {/* In Progress Card */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300">
                        <div className="flex flex-col space-y-2">
                            <h3 className="text-sm font-medium text-gray-600">In Progress</h3>
                            <div className="flex items-center justify-between">
                                <span className="text-3xl font-bold text-yellow-600">
                                    {filteredApplications.filter(app => app.status === 'interviewing').length}
                                </span>
                                <div className="bg-yellow-50 p-3 rounded-full">
                                    <HourglassIcon className="w-6 h-6 text-yellow-600" />
                                </div>
                            </div>
                        </div>
                    </div>
    
                    {/* Responses Card */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300">
                        <div className="flex flex-col space-y-2">
                            <h3 className="text-sm font-medium text-gray-600">Responses</h3>
                            <div className="flex items-center justify-between">
                                <span className="text-3xl font-bold text-green-600">
                                    {filteredApplications.filter(app => app.status !== 'applied').length}
                                </span>
                                <div className="bg-green-50 p-3 rounded-full">
                                    <InboxIcon className="w-6 h-6 text-green-600" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
    
                {/* Applications Table Section */}
                <div className="bg-white shadow-sm rounded-lg max-w-full mx-auto">
                    <div className='p-4 border-b border-gray-200'>
                        <h2 className="text-lg font-semibold text-gray-900">Recent Applications</h2>
                    </div>
                    
                    {/* Loading State */}
                    {loading && (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="text-gray-500 mt-2">Loading applications...</p>
                        </div>
                    )}
    
                    {/* Error State */}
                    {error && (
                        <div className="text-red-600 text-center py-8 px-4">
                            <p className="text-lg font-medium">{error}</p>
                            <p className="text-sm text-red-500 mt-1">Please try again later</p>
                        </div>
                    )}
    
                    {/* Empty State */}
                    {!loading && !error && applications.length === 0 && (
                        <div className="text-gray-500 text-center py-12 px-4">
                            <p className="text-lg font-medium">No applications yet</p>
                            <p className="text-sm text-gray-400 mt-1">Add your first application to get started</p>
                        </div>
                    )}
    
                    {/* Applications Table with Search */}
                    {!loading && !error && applications.length > 0 && (
                        <>
                            <div className="px-4 py-3">
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
    
                {/* Modals */}
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
    
                {applicationToDelete && (
                    <ConfirmDeleteModal
                        isOpen={isDeleteModalOpen}
                        onClose={() => {
                            setIsDeleteModalOpen(false);
                            setApplicationToDelete(null);
                        }}
                        onConfirm={confirmDelete}
                        company={applicationToDelete.company}
                    />
                )}
            </div>
        </div>
    );
};

export default Dashboard;