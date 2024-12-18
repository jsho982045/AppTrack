interface ParsedJobInfo {
    company: string;
    position: string;
    dateApplied: Date;
    status: 'applied' | 'interviewing' | 'rejected' | 'accepted';
    emailId: string;
}

export const parseJobEmail = (email: {
    subject: string,
    content: string,
    from: string,
    receivedDate: Date,
    emailId: string
}): ParsedJobInfo => {
    const companyName = extractCompanyName(email.subject, email.from, email.content);

    const position = extractPosition(email.content);

    return {
        company: companyName,
        position: position,
        dateApplied: email.receivedDate,
        status: 'applied',
        emailId: email.emailId
    };
};

const extractCompanyName = (subject: string, from: string, content: string): string => {
    const subjectPatterns = [
        /Thank you for (?:your application|applying) to ([\w\s&]+?)(?:!|\.|$)/i,
        /Your ([\w\s&]+?) Application/i,
        /Application (?:Received|Confirmation) - ([\w\s&]+)/i,
        /Welcome to ([\w\s&]+?)['s]? Hiring Process/i,
        /(?:applying|applied) to ([\w\s&]+?)(?:!|\.|$)/i,
    ];

    for (const pattern of subjectPatterns) {
        const match = subject.match(pattern);
        if(match?.[1]) {
            return cleanCompanyName(match[1]);
        }
    }

    const contentPatterns = [
        /Thank you for (?:your interest|applying) (?:in|to) ([\w\s&]+?)(?:!|\.|$)/i,
        /welcome to ([\w\s&]+?)['s]? hiring process/i,
        /position at ([\w\s&]+?)(?:!|\.|$)/i,
    ];

    for (const pattern of contentPatterns) {
        const match = content.match(pattern);
        if (match?.[1]) {
            return cleanCompanyName(match[1]);
        }
    }

    const domainMatch = from.match(/@([\w-]+)\./);
    if (domainMatch?.[1]) {
        const domain = domainMatch[1].toLowerCase();
        // Map common email domains to company names
        const domainMappings: { [key: string]: string } = {
            'amazon': 'Amazon',
            'google': 'Google',
            'roboflow': 'Roboflow',
            'lensa': 'Lensa',
            // Add more mappings as needed
        };
        if (domainMappings[domain]) {
            return domainMappings[domain];
        }
    }

    return "Unknown Company";
};

    const cleanCompanyName = (name: string): string => {
        // Add more common terms to filter out
        const termsToRemove = /(?:recruiting|careers|jobs|hr|noreply|mail|notifications|team|support)/gi;
        
        return name
            .trim()
            .replace(termsToRemove, '')
            .replace(/\s+/g, ' ')
            .replace(/\.$/, '') // Remove trailing period
            .trim();
    };

const extractPosition = (content: string): string => {
    const positionPatterns = [
        /position [":"](.*?)(?:\(|\.|\n)/i,        
        /role [":"](.*?)(?:\(|\.|\n)/i,            
        /applying for ["""](.*?)["""]/i,           
        /application for ["""](.*?)["""]/i,        
        /for the (.*?) position/i,                 
        /for the (.*?) role/i  
    ];

    for (const pattern of positionPatterns) {
        const match = content.match(pattern);
        if (match && match[1]) {
            const position = match[1].trim()
            .replace(/["""]/g, '')             
            .replace(/\s+/g, ' ');             
        return position; 
        }
    }
    return "Position Not Found";
};

const testParser = () => {
    const testEmails = [
        {
            subject: "Thank you for Applying to Amazon",
            content: "Thanks for applying to Amazon! We've received your "
        }
    ]
}
