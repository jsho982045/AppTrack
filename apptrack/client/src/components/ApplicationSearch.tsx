// client/src/components/ApplicationSearch.tsx
import { JobApplication } from '../types';
import { useState, useEffect } from 'react';
import { Search, Filter } from 'lucide-react';

interface SearchFilterProps {
    onFilter: (applications: JobApplication[]) => void;
    applications: JobApplication[];
}

const SearchFilter = ({ onFilter, applications }: SearchFilterProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Apply filters
    useEffect(() => {
        const filtered = applications.filter(app => {
            const matchesSearch = 
                app.company.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                app.position.toLowerCase().includes(debouncedSearch.toLowerCase());
            
            const matchesStatus = 
                selectedStatus === 'all' || app.status === selectedStatus;
            return matchesSearch && matchesStatus;
        });
        onFilter(filtered);
    }, [debouncedSearch, selectedStatus, applications, onFilter]);

    return (
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500 w-5 h-5" />
                <input
                    type="text"
                    placeholder="Search by company or position..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2.5 w-full bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder-gray-400 text-gray-600 transition-all duration-200"
                />
            </div>
            
            <div className="flex items-center gap-2">
                <Filter className="text-blue-500 w-5 h-5" />
                <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50 text-gray-600 cursor-pointer focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                >
                    <option value="all">All Status</option>
                    <option value="applied">Applied</option>
                    <option value="interviewing">Interviewing</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                </select>
            </div>
        </div>
    );
};

export default SearchFilter;