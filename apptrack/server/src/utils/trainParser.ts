// trainParser.ts
import { BayesClassifier } from 'natural';

// We'll keep this simple and only focus on company extraction
let classifier: BayesClassifier | null = null;

function cleanText(text: string): string {
    return text
        .replace(/[^\w\s@.-]/g, ' ')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
}

// Simple training data validation
function isValidTrainingEmail(doc: any): boolean {
    return doc.subject && 
           doc.content && 
           doc.from && 
           doc.company && 
           doc.company !== 'Unknown Company';
}

export async function trainClassifier(trainingEmails: any[]): Promise<void> {
    console.log(`Processing ${trainingEmails.length} training emails`);
    
    // Filter valid training data
    const validEmails = trainingEmails.filter(isValidTrainingEmail);
    console.log(`Found ${validEmails.length} valid training emails`);
    
    if (validEmails.length < 5) {
        console.log('Insufficient training data');
        return;
    }

    // Create and train classifier
    const newClassifier = new BayesClassifier();
    
    validEmails.forEach(email => {
        const text = cleanText(`${email.subject} ${email.content}`);
        newClassifier.addDocument(text, email.company);
    });

    newClassifier.train();
    console.log('Classifier trained successfully');
}

// Simple classification function
export function classifyEmail(email: { subject: string, content: string, from: string }) {
    const text = cleanText(`${email.subject} ${email.content}`);
    
    if (classifier) {
        try {
            const company = classifier.classify(text);
            return {
                company,
                position: 'Software Engineer' // Default position
            };
        } catch (error) {
            console.error('Classification error:', error);
        }
    }

    return {
        company: 'Unknown Company',
        position: 'Software Engineer'
    };
}