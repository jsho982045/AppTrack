import { useState } from 'react';
import { MoreVertical, Trash2, Edit2 } from 'lucide-react';

interface ApplicationActionsProps {
    onDelete: () => void;
    onEdit: () => void;
}

const ApplicationActions = ({ onDelete, onEdit }: ApplicationActionsProps) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className='p-1 hover:bg-gray-100 rounded-full'
                >
                    <MoreVertical size={16} />
                </button>

                {isOpen && (
                    <div className='absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg py-1 z-10'>
                        <button
                            onClick={() => {
                                onEdit();
                                setIsOpen(false);
                            }}
                            className='flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                            >
                                <Edit2 size={16} className='mr-2' />
                                Edit Application
                            </button>
                            <button
                                onClick={() => {
                                    onDelete();
                                    setIsOpen(false);
                                }}
                                className='flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100'
                                >
                                    <Trash2 size={16} className='mr-2' />
                                    Delete Application
                                </button>
                            </div>
                )}
        </div>
    );
};

export default ApplicationActions;