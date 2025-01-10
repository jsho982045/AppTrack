import { useState, useEffect } from 'react';
import { X,  Mail } from 'lucide-react';
import { JobApplication } from '../types';
import { fetchApplicationEmails } from '../services/api';

export interface EmailModalProps {
    isOpen: boolean;
    onClose: () => void;
    application: JobApplication;
}

export interface Email {
    id: string;
    subject: string;
    from: string;
    date: string;
    content: string;
    isFollowUp?: boolean;
    applicationId: string;
}

export const EmailModal = ({ isOpen, onClose, application }: EmailModalProps) => {
    const [emails, setEmails] = useState<Email[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEmail, setSelectedEmail] = useState<string | null>(null);

    useEffect(() => {
        const fetchEmails = async () => {
            if (application._id) {
                setLoading(true);
                try {
                    console.log('Fetching emails for:', application._id);
                    const data = await fetchApplicationEmails(application._id);
                    console.log('Received email data:', data); 
                    setEmails(data);
                    setSelectedEmail(data[0]?.id);
                } catch (error) {
                    console.error('Failed to fetch emails:', error);
                } finally {
                    setLoading(false);
                }
            }
        };

        if (isOpen) {
            fetchEmails();
        }
    }, [isOpen, application]);

    if (!isOpen) return null;

    const selectedEmailData = emails.find(email => email.id === selectedEmail);
    console.log('Selected Email Full Data:', selectedEmailData);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-4xl h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-semibold">
                        {application.company} - {application.position}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Email List Sidebar */}
                    <div className="w-1/3 border-r overflow-y-auto">
                        {loading ? (
                            <div className="p-4 text-center">Loading emails...</div>
                        ) : (
                            <div className="divide-y">
                                {emails.map((email) => (
                                    <div
                                        key={email.id}
                                        className={`p-4 cursor-pointer hover:bg-gray-50 ${
                                            selectedEmail === email.id ? 'bg-blue-50' : ''
                                        }`}
                                        onClick={() => setSelectedEmail(email.id)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <Mail className="w-4 h-4 text-gray-400" />
                                            {email.isFollowUp && (
                                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                                    Follow-up
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="font-medium mt-2 text-sm truncate">
                                            {email.subject}
                                        </h3>
                                        <p className="text-gray-500 text-sm mt-1">
                                            {new Date(email.date).toLocaleDateString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Email Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {loading ? (
                            <div className="text-center">Loading email content...</div>
                        ) : selectedEmailData ? (
                            <div className="h-full flex flex-col">
                                <div className="mb-6 bg-gray-50 p-4 rounded">
                                    <h3 className="text-xl font-medium mb-2">
                                        {selectedEmailData.subject}
                                    </h3>
                                    <div className="text-sm text-gray-500 space-y-1">
                                        <p>From: {selectedEmailData.from}</p>
                                        <p>Date: {selectedEmailData.date.toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="flex-1 bg-white border rounded-lg p-6 overflow-y-auto">
                                    {selectedEmailData.content.split('\n').map((line, i) => (
                                        <p key={i} className="mb-2 text-gray-900">
                                            {line}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-gray-500">
                                <p className="text-lg font-bold">No email selected</p>
                                <div className="mt-4 p-4 bg-red-100 rounded">
                                    <p className="font-bold text-red-800">DEBUG:</p>
                                    <p>Selected Email ID: {selectedEmail}</p>
                                     <p>Available Emails: {emails.length}</p>
                                    <p>Application ID: {application._id}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmailModal;