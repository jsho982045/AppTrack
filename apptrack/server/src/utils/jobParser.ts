// jobParser.ts
import { classifyEmail } from "./trainParser";

export interface ParsedJobInfo {
    company: string;
    position: string;
    dateApplied: Date;
    status: 'applied' | 'interviewing' | 'rejected' | 'accepted';
    emailId: string;
}

const JOB_KEYWORDS = [
    'applied',
    'application',
    'thank you for applying',
    'position',
    'role',
    'engineer',
    'developer',
    'software'
];

const EXCLUDE_KEYWORDS = [
    'newsletter',
    'subscription',
    'receipt',
    'order',
    'purchase',
    'payment',
    'invoice'
];

export function isJobApplication(from: string, subject: string): boolean {
    const lowerSubject = subject.toLowerCase();
    const lowerFrom = from.toLowerCase();

    // Check known providers
    for (const provider of providers) {
        if (provider.test(from)) return true;
    }

    // Check for obvious non-job emails
    if (EXCLUDE_KEYWORDS.some(word => lowerSubject.includes(word))) {
        return false;
    }

    // Check for job-related keywords
    return JOB_KEYWORDS.some(word => 
        lowerSubject.includes(word) || lowerFrom.includes(word)
    );
}

const providers = [
    {
        name: 'LinkedIn',
        test: (from: string) => from.includes('linkedin.com'),
        parse: (email: { subject: string, content: string }) => {
            // Split content into lines and filter out noise
            const lines = email.content.split('\n')
                .map(line => line.trim())
                .filter(line => line && !line.includes('View job:') && !line.includes('http'));
            
            // Usually first two non-empty lines are position and company
            if (lines.length >= 2) {
                return {
                    position: lines[0],
                    company: lines[1]
                };
            }
            return null;
        }
    },
    {
        name: 'Greenhouse',
        test: (from: string) => from.includes('greenhouse-mail.io'),
        parse: (email: { subject: string, content: string }) => {
            const match = email.content.match(/applying (?:to|for) ([^.!,\n]+)/i);
            return match ? { company: match[1].trim(), position: 'Software Engineer' } : null;
        }
    },
    {
        name: 'Workday',
        test: (from: string) => from.includes('myworkday.com'),
        parse: (email: { subject: string, content: string }) => {
            const match = email.subject.match(/Application (?:at|with) ([^.!,\n]+)/i);
            return match ? { company: match[1].trim(), position: 'Software Engineer' } : null;
        }
    }
];

// Simple cleanup functions
function cleanupText(text: string): string {
    return text
        .replace(/\s+/g, ' ')           // Normalize whitespace
        .replace(/[^\w\s-]/g, '')       // Remove special characters
        .trim();
}

export function parseJobEmail(email: { 
    subject: string, 
    content: string, 
    from: string,
    receivedDate: Date,
    emailId: string 
}): ParsedJobInfo {
    // Try to find a matching provider
    for (const provider of providers) {
        if (provider.test(email.from)) {
            const result = provider.parse(email);
            if (result?.company && result?.position) {
                return {
                    company: cleanupText(result.company),
                    position: cleanupText(result.position),
                    dateApplied: email.receivedDate,
                    status: 'applied',
                    emailId: email.emailId
                };
            }
        }
    }

    // Simple fallback: try to find common patterns in subject
    const subjectMatch = email.subject.match(/(?:applying to|application for) ([^.!,\n]+)/i);
    if (subjectMatch?.[1]) {
        return {
            company: cleanupText(subjectMatch[1]),
            position: 'Software Engineer',
            dateApplied: email.receivedDate,
            status: 'applied',
            emailId: email.emailId
        };
    }

    // If all else fails, return unknown
    return {
        company: 'Unknown Company',
        position: 'Software Engineer',
        dateApplied: email.receivedDate,
        status: 'applied',
        emailId: email.emailId
    };
}

// Simple duplicate detection
export function isDuplicate(existing: ParsedJobInfo, newApp: ParsedJobInfo): boolean {
    if (existing.emailId === newApp.emailId) return true;
    
    const sameCompany = cleanupText(existing.company) === cleanupText(newApp.company);
    const samePosition = cleanupText(existing.position) === cleanupText(newApp.position);
    if (sameCompany && samePosition) {
        const hoursDiff = Math.abs(existing.dateApplied.getTime() - newApp.dateApplied.getTime()) / (1000 * 60 * 60);
        return hoursDiff < 24;
    }
    return false;
}