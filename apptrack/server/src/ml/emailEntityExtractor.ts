// src/ml/emailEntityExtractor.ts
import natural from 'natural';
import compromise from 'compromise';
import { removeStopwords } from 'stopword';

interface ExtractionResult {
    company: {
        value: string;
        confidence: number;
    };
    position: {
        value: string;
        confidence: number;
    };
    dateApplied: Date;
}

interface ConfidenceFactors {
    matches: number;
    patterns: number;
    consistency: number;
}

export class EmailEntityExtractor {
    private tokenizer: natural.WordTokenizer;
    private companyIndicators = [
        'careers', 'jobs', '.com', 'inc', 'llc', 'corp', 'incorporated',
        'thank you for applying to', 'application received at'
    ];
    
    private positionIndicators = [
        'engineer', 'developer', 'software', 'frontend', 'backend', 'full stack',
        'role', 'position', 'job'
    ];

    private calculateConfidence(factors: ConfidenceFactors): number {
        const weights = {
            matches: 0.4,    // How many times we found the entity
            patterns: 0.4,   // How strong the matching pattern was
            consistency: 0.2  // How consistent across different parts of the email
        };

        return Math.min(
            (factors.matches * weights.matches) +
            (factors.patterns * weights.patterns) +
            (factors.consistency * weights.consistency),
            0.999  // Never return 100% confidence
        );
    }

    constructor() {
        this.tokenizer = new natural.WordTokenizer();
    }

    async extractEntities(email: { subject: string; content: string; from: string }): Promise<ExtractionResult> {
        // Combine all text for analysis
        const fullText = `${email.subject} ${email.content} ${email.from}`.toLowerCase();
        
        // Use Compromise for initial NLP parsing
        const doc = compromise(fullText);
        
        // Extract company
        const company = this.extractCompany(doc, email);
        
        // Extract position
        const position = this.extractPosition(doc, email);

        return {
            company,
            position,
            dateApplied: new Date()
        };
    }

    private extractCompany(doc: any, email: { subject: string; content: string; from: string }) {
        let confidenceFactors: ConfidenceFactors = {
            matches: 0,
            patterns: 0,
            consistency: 0
        };
        
        let company = { value: 'Unknown Company', confidence: 0 };
        const fullText = `${email.subject} ${email.content}`.toLowerCase();
        
        // Check email domain first
        const domainMatch = email.from.match(/@([^.]+)\./);
        if (domainMatch) {
            const domain = domainMatch[1];
            if (!['gmail', 'yahoo', 'hotmail', 'outlook'].includes(domain)) {
                confidenceFactors.matches += 1;
                confidenceFactors.patterns += 0.8;
                company.value = domain.charAt(0).toUpperCase() + domain.slice(1);

                if (fullText.includes(domain.toLowerCase())) {
                    confidenceFactors.consistency += 1;
                }
            }
        }

        // Check for "applying to" pattern
        const applyingToMatch = email.subject.match(/applying to ([^!.]*)/i);
        if (applyingToMatch) {
            const candidate = applyingToMatch[1].trim();
            confidenceFactors.patterns += 1;
            
            // If this matches our previous company name, increase confidence
            if (candidate.toLowerCase() === company.value.toLowerCase()) {
                confidenceFactors.matches += 1;
                confidenceFactors.consistency += 1;
            }
            
            company.value = candidate;
        }

        // Check for company mentions in content
        const companyMentions = (fullText.match(new RegExp(company.value, 'gi')) || []).length;
        confidenceFactors.matches += Math.min(companyMentions / 2, 1); // Cap at 1

        company.confidence = this.calculateConfidence(confidenceFactors);
        return company;
    }


    private extractPosition(doc: any, email: { subject: string; content: string; from: string }) {
        let confidenceFactors: ConfidenceFactors = {
            matches: 0,
            patterns: 0,
            consistency: 0
        };

        let position = { value: 'Software Engineer*', confidence: 0.3 };
        
        // Look for position in structured format
        const structuredMatch = email.content.match(/application for the ([^(]*)(\(ID:|\(Ref:)/i);
        if (structuredMatch) {
            confidenceFactors.patterns += 1;
            position.value = structuredMatch[1].trim();
            
            // Check if position contains key terms
            if (/engineer|developer|architect/i.test(position.value)) {
                confidenceFactors.matches += 1;
            }
        }

        // Check for position consistency
        if (email.subject.toLowerCase().includes(position.value.toLowerCase())) {
            confidenceFactors.consistency += 1;
        }

        position.confidence = this.calculateConfidence(confidenceFactors);
        return position;
    }
}