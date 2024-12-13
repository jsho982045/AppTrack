import React, { useState } from "react";
import { JobApplication } from "../types";

interface AddApplicationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (applicaiton: Omit<JobApplication, '_id'>) => void;
}

const AddApplicationModal = ({ isOpen, onClose, onSubmit }: AddApplicationModalProps) => {
    const [formData, setFormData] = useState({
        company: '',
        position: '',
        dateApplied: new Date().toISOString().split('T')[0],
        status: 'applied' as const,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            ...formData,
            dateApplied: new Date(formData.dateApplied)
        });
        onClose();
    };

    if(!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg w-full max-w-md">
                <h2 className="text-xl font-semibold mb-4">Add New Application</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Company
                        </label>
                        <input
                            type="text"
                            value={formData.company}
                            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                            className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Position
                        </label>
                        <input
                            type="text"
                            value={formData.position}
                            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                            className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Date Applied
                        </label>
                        <input
                            type="date"
                            value={formData.dateApplied}
                            onChange={(e) => setFormData({ ...formData, dateApplied: e.target.value })}
                            className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            Add Application
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


export default AddApplicationModal;