import { useState } from 'react';
import { ChevronDown, ChevronUp, Mail } from 'lucide-react';
import { JobApplication } from '../types';
import ApplicationActions from './ApplicationActions';

interface ApplicationTableProps {
    applications: JobApplication[];
    onDelete: (id: string) => void;
    onEdit: (application: JobApplication) => void;
}

const ApplicationTable = ({ applications, onDelete, onEdit }: ApplicationTableProps) => {
    const [sortField, setSortField] = useState<keyof JobApplication>('dateApplied');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

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
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <ApplicationActions 
                                    onDelete={() => onDelete(app._id!)}
                                    onEdit={() => onEdit(app)}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ApplicationTable;