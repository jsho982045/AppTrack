import { useState, useEffect } from 'react';
import { Search, Filter } from 'lucide-react';
import { JobApplication } from '../types';

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
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                    type="text"
                    placeholder="Search by company or position..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
            </div>
            
            <div className="flex items-center gap-2">
                <Filter className="text-gray-400 w-5 h-5" />
                <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="border rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
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