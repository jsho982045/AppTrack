//client/src/types.ts
export interface JobApplication {
    _id?: string;
    company: string;
    position: string;
    dateApplied: Date;
    status: 'applied' | 'interviewing' | 'rejected' | 'accepted';
    emailId?: string;
}

export interface EmailData {
    _id: string;
    subject: string;
    content: string;
    from: string;
    receivedDate: string;
    isApplicationEmail: boolean;
}

export interface Email {
    id: string;
    subject: string;
    from: string;
    date: string;
    content: string;
    isFollowUp?: boolean;
}