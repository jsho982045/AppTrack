import React, { useState, useEffect } from "react";
import { JobApplication } from "../types";


interface EditApplicationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (application: JobApplication) => void;
    application: JobApplication;
}

const EditApplicationModal = ({ isOpen, onClose, onSubmit, application }: EditApplicationModalProps) => {
    const [formData, setFormData] = useState<JobApplication>(application);

    useEffect(() => {
        setFormData(application);
    }, [application]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg w-full max-w-md">
                <h2 className="text-xl font-semibold mb-4">Edit Application</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Company
                        </label>
                        <input
                            type="text"
                            value={formData.company}
                            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                            className="w-full p-2 border rounded focus:string-blue-500 focus:border-blue-500"
                            required
                            />
                    </div>
                    <div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Position
                            </label>
                            <input
                                type="text"
                                value={formData.position}
                                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                className="w-full p-2 border rounded focus:string-blue-500 foucs:border-blue-500"
                                required
                                />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Status
                            </label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({...formData, status: e.target.value as JobApplication['status' ] })}
                                className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-600"
                                >
                                    <option value="applied">Applied</option>
                                    <option value="interviewing">Interviewing</option>
                                    <option value="rejected">Rejected</option>
                                    <option value="accepted">Accepted</option>
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Date Applied
                                </label>
                                <input
                                    type="date"
                                    value={new Date(formData.dateApplied).toISOString().split('T')[0]}
                                    onChange={(e) => setFormData({ ...formData, dateApplied: new Date(e.target.value) })}
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
                                            Save Changes
                                        </button>
                            </div>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default EditApplicationModal;