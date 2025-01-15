import { LogOut, BarChart2 } from 'lucide-react';
import { authApi } from '../services/auth';

const Navbar = () => {

    const handleLogout = async () => {
        try {
            await authApi.logout();
            window.location.href = '/login';
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <nav className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex-shrink-0 flex items-center">
                        <BarChart2 className='h-8 w-8 text-blue-600 mr-2' />
                        <span className="text-xl font-bold bg:gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                            Apptrack
                        </span>
                    </div>
                    <div className="flex items-center">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                        >
                            <LogOut className="h-4 w-4 text-blue-500" /> {/* Changed text-gray-500 to text-blue-500 */}
                            <span className="font-medium">Logout</span>
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;