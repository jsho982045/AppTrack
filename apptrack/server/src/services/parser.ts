// server/src/services/parser.ts
import axios from 'axios';
import { IJobApplicationDocument } from '../models/JobApplication';

interface EmailData {
    subject: string;
    content: string;
    from_email: string;
}

interface ParsedJobData {
    company: string;
    position: string;
    dateApplied: string;
    status: 'applied' | 'interviewing' | 'rejected' | 'accepted';
    confidence_score: number;
}

export class ParserService {
    private readonly ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

    async parseJobEmail(emailData: EmailData): Promise<Partial<IJobApplicationDocument>> {
        try {
            const response = await axios.post<ParsedJobData>(
                `${this.ML_SERVICE_URL}/parse`,
                emailData
            );

            return {
                company: response.data.company,
                position: response.data.position,
                dateApplied: new Date(response.data.dateApplied),
                status: response.data.status
            };
        } catch (error) {
            console.error('Error parsing job email:', error);
            throw new Error('Failed to parse job email');
        }
    }
}