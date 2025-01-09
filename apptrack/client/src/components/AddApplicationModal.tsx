import React, { useState } from "react";
import { JobApplication } from "../types";
import { X } from "lucide-react";

interface AddApplicationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (applicaiton: Omit<JobApplication, '_id'>) => void;
}

interface FormErrors {
    company?: string;
    position?: string;
    dateApplied?: string;
}

const AddApplicationModal = ({ isOpen, onClose, onSubmit }: AddApplicationModalProps) => {
    const [formData, setFormData] = useState({
        company: '',
        position: '',
        dateApplied: new Date().toISOString().split('T')[0],
        status: 'applied' as const,
    });

    const [errors, setErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        if (!formData.company.trim()) {
            newErrors.company = 'Company name is required';
        } else if (formData.company.length < 2) {
            newErrors.company = 'Company name is too short';
        }

        if (!formData.position.trim()){
            newErrors.position = 'Position is required';
        }

        const selectedDate = new Date(formData.dateApplied);
        const today = new Date();
        if (selectedDate > today) {
            newErrors.dateApplied = 'Date cannot be in the future'
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            await onSubmit({
                ...formData,
                dateApplied: new Date(formData.dateApplied)
        });
        onClose();
        } catch (error) {
            console.error('Failed to submit:', error);
        }finally {
            setIsSubmitting(false);
        }
    };

    if(!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                    <X className="w-5 h-5" />
                </button>
                
                <h2 className="text-xl font-semibold mb-4">Add New Application</h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Company
                        </label>
                        <input
                            type="text"
                            value={formData.company}
                            onChange={(e) => {
                                setFormData({ ...formData, company: e.target.value });
                                if (errors.company) {
                                    setErrors({ ...errors, company: undefined });
                                }
                            }}
                            className={`w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500 
                                ${errors.company ? 'border-red-500' : 'border-gray-300'}`}
                            placeholder="Enter company name"
                        />
                        {errors.company && (
                            <p className="text-red-500 text-sm mt-1">{errors.company}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Position
                        </label>
                        <input
                            type="text"
                            value={formData.position}
                            onChange={(e) => {
                                setFormData({ ...formData, position: e.target.value });
                                if (errors.position) {
                                    setErrors({ ...errors, position: undefined });
                                }
                            }}
                            className={`w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500
                                ${errors.position ? 'border-red-500' : 'border-gray-300'}`}
                            placeholder="Enter position title"
                        />
                        {errors.position && (
                            <p className="text-red-500 text-sm mt-1">{errors.position}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Date Applied
                        </label>
                        <input
                            type="date"
                            value={formData.dateApplied}
                            max={new Date().toISOString().split('T')[0]}
                            onChange={(e) => {
                                setFormData({ ...formData, dateApplied: e.target.value });
                                if (errors.dateApplied) {
                                    setErrors({ ...errors, dateApplied: undefined });
                                }
                            }}
                            className={`w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500
                                ${errors.dateApplied ? 'border-red-500' : 'border-gray-300'}`}
                        />
                        {errors.dateApplied && (
                            <p className="text-red-500 text-sm mt-1">{errors.dateApplied}</p>
                        )}
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 
                                disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Adding...' : 'Add Application'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddApplicationModal;