const Dashboard = () => {
    return (
        <div className="min-h-screen bg-gray-100">
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">
                    Job Applications Dashboard
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-medium text-gray-900">Total Applications</h3>
                        <p className="text-2xl font-bold text-blue-600">0</p>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-medium text-gray-900">In Progress</h3>
                        <p className="text-2xl font-bold text-yellow-600">0</p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium text-gray-900">Responses</h3>
                    <p className="text-2xl font-bold text-green-600">0</p>
                </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Recent Applications</h2>
                <div className="text-gray-900 text-center py-8">
                    No applications yet
                </div>
            </div>
        </div>
    </div>
    );
};

export default Dashboard;