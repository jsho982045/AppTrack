import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Mail, MoreVertical, Pencil, Trash } from 'lucide-react';
import { JobApplication } from '../types';

interface ApplicationTableProps {
    applications: JobApplication[];
    onDelete: (id: string) => void;
    onEdit: (application: JobApplication) => void;
}

const ApplicationTable = ({ applications, onDelete, onEdit }: ApplicationTableProps) => {
    const [sortField, setSortField] = useState<keyof JobApplication>('dateApplied');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [openActionId, setOpenActionId] = useState<string | null>(null);

    const handleSort = (field: keyof JobApplication) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const sortedApplications = [...applications].sort((a, b) => {
        if (sortField === 'dateApplied') {
            return sortDirection === 'asc' 
                ? new Date(a[sortField]).getTime() - new Date(b[sortField]).getTime()
                : new Date(b[sortField]).getTime() - new Date(a[sortField]).getTime();
        }
        return sortDirection === 'asc'
            ? String(a[sortField]).localeCompare(String(b[sortField]))
            : String(b[sortField]).localeCompare(String(a[sortField]));
    });

    const SortIcon = ({ field }: { field: keyof JobApplication }) => {
        if (sortField !== field) return null;
        return sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
    };

    const toggleActions = (id: string) => {
        setOpenActionId(openActionId === id ? null : id); 
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (openActionId && !(event.target as Element).closest('action-menu')) {
                setOpenActionId(null);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () =>{
            document.removeEventListener('click', handleClickOutside);
    };
}, [openActionId]);

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            onClick={() => handleSort('company')}
                        >
                            <div className="flex items-center space-x-1">
                                <span>Company</span>
                                <SortIcon field="company" />
                            </div>
                        </th>
                        <th 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            onClick={() => handleSort('position')}
                        >
                            <div className="flex items-center space-x-1">
                                <span>Position</span>
                                <SortIcon field="position" />
                            </div>
                        </th>
                        <th 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            onClick={() => handleSort('dateApplied')}
                        >
                            <div className="flex items-center space-x-1">
                                <span>Date Applied</span>
                                <SortIcon field="dateApplied" />
                            </div>
                        </th>
                        <th 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            onClick={() => handleSort('status')}
                        >
                            <div className="flex items-center space-x-1">
                                <span>Status</span>
                                <SortIcon field="status" />
                            </div>
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {sortedApplications.map(app => (
                        <tr key={app._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900 flex items-center space-x-2">
                                    <span>{app.company}</span>
                                    {app.emailId && (
                                        <Mail className="w-4 h-4 text-gray-400" />
                                    )}
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="text-sm text-gray-900">{app.position}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">
                                    {new Date(app.dateApplied).toLocaleDateString()}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                                    ${app.status === 'applied' ? 'bg-blue-100 text-blue-800' : ''}
                                    ${app.status === 'interviewing' ? 'bg-yellow-100 text-yellow-800' : ''}
                                    ${app.status === 'rejected' ? 'bg-red-100 text-red-800' : ''}
                                    ${app.status === 'accepted' ? 'bg-green-100 text-green-800' : ''}
                                `}>
                                    {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleActions(app._id!);
                                    }}
                                    className='text-gray-400 hover:text-gray-600 action-menu'
                                    >
                                        <MoreVertical className='w-5 h-5' />
                                    </button>

                                    {openActionId === app._id && (
                                        <div className='absolute right-0 mt-2 py-2 w-48 bg-white roounded-md shadow-xl z-50 action-menu'>
                                            <button
                                                onClick={() => {
                                                    onEdit(app);
                                                    setOpenActionId(null);
                                                }}
                                                className='flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full'
                                                >
                                                    <Pencil className='w-4 h-4 mr-2' />
                                                    Edit Application
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        onDelete(app._id!);
                                                        setOpenActionId(null);
                                                    }}
                                                    className='flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full'
                                                >
                                                    <Trash className='w-4 h-4 mr-2' />
                                                    Delete Application
                                                </button>
                                            </div>
                                        )}
                                 </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

export default ApplicationTable;