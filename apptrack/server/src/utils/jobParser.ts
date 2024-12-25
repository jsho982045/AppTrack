// server/src/utils/jobParser.ts
import { classifyEmail } from "./trainParser";

export interface ATSProvider {
    name: string;
    domains: string[];
    isATS: (from: string) => boolean;
    parseCompany?: (email: { subject: string, content: string }) => string | null;
    parsePosition?: (email: { subject: string, content: string }) => string | null;
}

export interface ParsedJobInfo {
    company: string;
    position: string;
    dateApplied: Date;
    status: 'applied' | 'interviewing' | 'rejected' | 'accepted';
    emailId: string;
}

export const atsProviders: ATSProvider[] = [
    {
        name: 'Greenhouse',
        domains: ['greenhouse-mail.io'],
        isATS: (from: string) => from.includes('greenhouse-mail.io'),
        parseCompany: (email) => {
            const match = email.content.match(/application (?:to|for) ([^.!,\n]+)/i);
            return match ? match[1].trim() : null;
        },
        parsePosition: (email) => {
            const match = email.content.match(/applying for the ([^.!,\n]+?) position/i);
            return match ? match[1].trim() : null;
        }
    },
    {
        name: 'Workday',
        domains: ['myworkday.com'],
        isATS: (from: string) => from.includes('@myworkday.com'),
        parseCompany: (email) => {
            const match = email.subject.match(/Application (?:at|with) ([^.!,\n]+)/i);
            return match ? match[1].trim() : null;
        }
    },
    {
        name: 'iCIMS',
        domains: ['talent.icims.com'],
        isATS: (from: string) => from.includes('talent.icims.com'),
        parseCompany: (email) => {
            const match = email.content.match(/Thank you for applying to ([^.!,\n]+)/i);
            return match ? match[1].trim() : null;
        }
    },
    {
        name: 'Amazon Jobs',
        domains: ['amazon.jobs'],
        isATS: (from: string) => from.includes('amazon.jobs'),
        parseCompany: () => 'Amazon',
        parsePosition: (email) => {
            // Special handling for Amazon's format
            const match = email.content.match(/application for the (.*?)\s*\(ID: \d+\)/i);
            return match ? match[1].trim() : null;
        }
    }
];

interface EmailPattern {
    pattern: RegExp;
    source: 'subject' | 'content';
}

const companyPatterns: EmailPattern[] = [
    {
        pattern: /Thank you for [Aa]pplying to ([^.!,\n]+)/i,
        source: 'subject'
    },
    {
        pattern: /application (?:to|for|with) ([^.!,\n]+)/i,
        source: 'content'
    },
    {
        pattern: /applying (?:to|at|with) ([^.!,\n]+)/i,
        source: 'content'
    }
];

const additionalCompanyPatterns = [
    // Remove "the" prefix and position suffixes
    (text: string) => {
        const match = text.match(/^(?:the\s+)?([^-\n]+?)(?:\s*-\s*.*)?$/i);
        return match ? match[1].trim() : null;
    },
    // Handle "at Company" format
    (text: string) => {
        const match = text.match(/(?:at|with)\s+([^,\n]+)/i);
        return match ? match[1].trim() : null;
    }
];


const positionPatterns: EmailPattern[] = [
    {
        pattern: /application for the (.*?)(?:\(ID: \d+\)|position|role|\.|$)/i,
        source: 'content'
    },
    {
        pattern: /applying for(?: the)? ([^.!,\n]+?) position/i,
        source: 'content'
    },
    {
        pattern: /role:?\s*([^.!,\n]+)/i,
        source: 'content'
    }
];

const additionalPositionPatterns = [
    // Extract position from role titles
    (text: string) => {
        const match = text.match(/(?:for the|position:|role:)\s*([^,\n]+)(?=\s*(?:at|with|$))/i);
        return match ? match[1].trim() : null;
    },
    // Handle intern positions
    (text: string) => {
        const match = text.match(/([^,\n]+?(?:Intern|Internship)[^,\n]*)/i);
        return match ? match[1].trim() : null;
    }
];


export function isJobApplication(from: string, subject: string): boolean {
    if (atsProviders.some((provider) => provider.isATS(from))) {
        return true;
    }

    const strongIndicators = [
        'thank you for applying',
        'application received',
        'application confirmation',
        'thank you for your interest',
        'position of',
        'role of'
    ];

    const jobKeywords = [
        'engineer', 'developer', 'software', 'position', 'application',
        'job', 'career', 'role', 'applied'
    ];

    // Exclude common non-job email subjects
    const excludeKeywords = [
        'newsletter', 'news alert', 'promotion', 'offer', 'sale',
        'discount', 'deal', 'shopping', 'payment', 'bill'
    ];

    const subjectLower = subject.toLowerCase();
    const fromLower = from.toLowerCase();

    // Exclude if contains exclude keywords
    if (excludeKeywords.some(keyword => subjectLower.includes(keyword))) {
        return false;
    }

    // Include if contains strong indicators
    if (strongIndicators.some(indicator => 
        subjectLower.includes(indicator) || fromLower.includes(indicator))) {
        return true;
    }

    // Must have at least one job keyword
    return jobKeywords.some(keyword => subjectLower.includes(keyword));
}

function tryPatterns(
    email: { subject: string, content: string }, 
    patterns: EmailPattern[],
    additionalPatterns?: ((text: string) => string | null)[]
): string | null {
    for (const { pattern, source } of patterns) {
        const text = email[source];
        if (!text) continue;
        
        const match = text.match(pattern);
        if (match && match[1]) {
            return cleanupCompany(match[1]);
        }
    }

    if (additionalPatterns) {
        for (const pattern of additionalPatterns) {
            // Try subject
            const subjectMatch = pattern(email.subject);
            if (subjectMatch) {
                return cleanupCompany(subjectMatch);
            }
            
            // Try content
            const contentMatch = pattern(email.content);
            if (contentMatch) {
                return cleanupCompany(contentMatch);
            }
        }
    }


    return null;
}

export const parseJobEmail = (email: {
    subject: string,
    content: string,
    from: string,
    receivedDate: Date,
    emailId: string
}): ParsedJobInfo => {
    let { company, position } = classifyEmail({
        subject: email.subject,
        content: email.content,
        from: email.from
    });

    // First try ATS-specific parsing
    const atsProvider = atsProviders.find(provider => provider.isATS(email.from));
    if (atsProvider) {
        if (atsProvider.parseCompany) {
            const atsCompany = atsProvider.parseCompany(email);
            if (atsCompany) company = atsCompany;
        }
        if (atsProvider.parsePosition) {
            const atsPosition = atsProvider.parsePosition(email);
            if (atsPosition) position = atsPosition;
        }
    }

    // If still needed, try general patterns
    if (!company || company === 'Unknown Company') {
        const extractedCompany = tryPatterns(email, companyPatterns, additionalCompanyPatterns);
        if (extractedCompany) company = extractedCompany;
    }

    if (!position || position === 'Software Engineer') {
        const extractedPosition = tryPatterns(email, positionPatterns, additionalPositionPatterns);
        if (extractedPosition) {
            position = extractedPosition
                .replace(/\(ID: \d+\)/g, '')
                .replace(/\([^)]+\)/g, '')
                .trim();
        }
    }

    if (company) {
        company = company
            .replace(/\s*-\s*Software Engineer.*$/i, '')
            .replace(/\s*-\s*Developer.*$/i, '')
            .replace(/\s+position$/i, '')
            .replace(/\s+role$/i, '')
            .trim();

    }

    // HTML entity decoding for cleaner text
    company = company ? decodeHtmlEntities(company) : 'Unknown Company';
    position = position ? decodeHtmlEntities(position) : 'Software Engineer';

    return {
        company,
        position,
        dateApplied: email.receivedDate,
        status: 'applied',
        emailId: email.emailId,
    };
};

function cleanupCompany(raw: string): string {
    return raw
        .replace(/!+$/, '')                // Remove trailing exclamation marks
        .replace(/\([^)]*\)/g, '')         // Remove parentheticals
        .replace(/\s+/g, ' ')              // Normalize whitespace
        .trim();
}

function decodeHtmlEntities(text: string): string {
    return text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ');
}