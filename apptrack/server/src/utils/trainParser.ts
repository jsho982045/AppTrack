import { MongoClient } from 'mongodb';
import { BayesClassifier } from 'natural';
import { atsProviders } from './jobParser';  // Import ATS providers

export interface EmailData {
    subject: string;
    content: string;
    from: string;
    company: string;
    position: string;
}

let trainedClassifiers: {
    companyClassifier: BayesClassifier;
    positionClassifier: BayesClassifier;
} | null = null;

export function cleanText(text: string): string {
    return text
        .replace(/[^\w\s@.-]/g, ' ')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
}

export function extractEmailDomain(from: string | undefined): string {
    if(!from) return '';
    const match = from.match(/@([^>]+)/);
    return match ? match[1].toLowerCase() : '';
}

// Enhanced company name normalization using ATS info
export function normalizeCompanyName(name: string, from: string): string {

    if (!name || !from) return name || '';
    const atsProvider = atsProviders.find(provider => 
        provider.domains.some(domain => from.includes(domain))
    );
    
    if (atsProvider) {
        console.log(`Detected ${atsProvider.name} as ATS provider`);
    }

    return name
        .replace(/\b(inc|llc|corp|ltd)\b/gi, '')
        .replace(/[^\w\s]/g, ' ')
        .trim();
}

async function validateTrainingData(doc: any): Promise<boolean> {
    if (!doc.subject || !doc.content || !doc.from) {
        console.log('Missing required fields:', doc._id);
        return false;
    }
    
    // Enhanced validation using ATS knowledge
    const isFromATS = atsProviders.some(provider => 
        provider.domains.some(domain => doc.from.includes(domain))
    );
    
    if (!doc.company || doc.company === 'Unknown Company' || 
        !doc.position || doc.position === 'Position Not Found') {
        // If it's from an ATS but we don't have company/position, that's definitely invalid
        if (isFromATS) {
            console.log('Invalid ATS email missing company/position:', doc._id);
            return false;
        }
        console.log('Invalid company or position:', doc._id);
        return false;
    }

    if (doc.company.length < 2 || doc.position.length < 3) {
        console.log('Company or position too short:', doc._id);
        return false;
    }

    return true;
}

async function initializeTrainingData(client: MongoClient) {
    const db = client.db('test');
    console.log('Initializing training data...');
    
    const trainingCollection = db.collection('trainingemails');
    const count = await trainingCollection.countDocuments();
    console.log(`Found ${count} documents in training collection`);
    
    if (count === 0) {
        const jobsCollection = db.collection('jobapplications');
        // Prioritize ATS emails for initial training
        const existingEmails = await jobsCollection
            .find({
                company: { $exists: true, $ne: 'Unknown Company' },
                position: { $exists: true, $ne: 'Position Not Found' },
                from: { 
                    $regex: new RegExp(atsProviders.map(p => 
                        p.domains.join('|')).join('|'), 'i') 
                }
            })
            .toArray();
        
        if (existingEmails.length > 0) {
            const validEmails = existingEmails.filter(await validateTrainingData);
            if (validEmails.length > 0) {
                await trainingCollection.insertMany(validEmails);
                console.log(`Added ${validEmails.length} validated ATS emails to training set`);
            }
        }
    }
    
    return trainingCollection;
}

async function getAllTrainingEmails(): Promise<EmailData[]> {
    try {
        const client = await MongoClient.connect(process.env.MONGODB_URI!);
        const trainingCollection = await initializeTrainingData(client);
        
        const documents = await trainingCollection.find({}).toArray();
        console.log(`Retrieved ${documents.length} training documents`);

        const validatedDocs = [];
        for (const doc of documents) {
            if (await validateTrainingData(doc)) {
                validatedDocs.push({
                    subject: cleanText(doc.subject),
                    content: cleanText(doc.content),
                    from: cleanText(doc.from),
                    company: normalizeCompanyName(doc.company, doc.from),
                    position: doc.position
                });
            }
        }

        console.log(`Validated ${validatedDocs.length} documents for training`);
        return validatedDocs;
    } catch (error) {
        console.error('Error fetching training emails:', error);
        return [];
    }
}

async function trainClassifiers() {
    console.log('Starting classifier training...');
    const companyClassifier = new BayesClassifier();
    const positionClassifier = new BayesClassifier();

    const emails = await getAllTrainingEmails();
    if (emails.length < 10) {
        console.error('Insufficient training data, minimum 10 examples required');
        return null;
    }

    const shuffled = emails.sort(() => 0.5 - Math.random());
    const splitIndex = Math.floor(emails.length * 0.8);
    const trainingSet = shuffled.slice(0, splitIndex);
    const testingSet = shuffled.slice(splitIndex);

    console.log(`Training set: ${trainingSet.length}, Testing set: ${testingSet.length}`);

    // Enhanced training with ATS awareness
    trainingSet.forEach((email, index) => {
        const domain = extractEmailDomain(email.from);
        const isATS = atsProviders.some(provider => 
            provider.domains.includes(domain)
        );

        // Create rich features
        const companyFeatures = [
            email.subject,
            email.content,
            domain,
            isATS ? 'ats_email' : 'other_email',
            email.from
        ].join(' ');

        const positionFeatures = [
            email.subject,
            email.content.split('.')[0],
            isATS ? 'ats_position' : 'other_position',
            email.position
        ].join(' ');

        companyClassifier.addDocument(cleanText(companyFeatures), email.company);
        positionClassifier.addDocument(cleanText(positionFeatures), email.position);
        
        if (index % 50 === 0) {
            console.log(`Processed ${index + 1}/${trainingSet.length} training examples`);
        }
    });

    console.log('Training classifiers...');
    companyClassifier.train();
    positionClassifier.train();

    // Evaluation
    let correctCompanies = 0;
    let correctPositions = 0;
    let atsCorrect = 0;
    let atsTotal = 0;

    testingSet.forEach(email => {
        const domain = extractEmailDomain(email.from);
        const isATS = atsProviders.some(provider => 
            provider.domains.includes(domain)
        );

        const predictedCompany = companyClassifier.classify(
            cleanText(`${email.subject} ${email.content} ${email.from}`)
        );
        const predictedPosition = positionClassifier.classify(
            cleanText(`${email.subject} ${email.content}`)
        );

        if (normalizeCompanyName(predictedCompany, email.from) === 
            normalizeCompanyName(email.company, email.from)) {
            correctCompanies++;
            if (isATS) {
                atsCorrect++;
            }
        }
        if (predictedPosition === email.position) {
            correctPositions++;
        }
        if (isATS) {
            atsTotal++;
        }
    });

    const companyAccuracy = (correctCompanies / testingSet.length * 100).toFixed(2);
    const positionAccuracy = (correctPositions / testingSet.length * 100).toFixed(2);
    const atsAccuracy = atsTotal > 0 ? 
        (atsCorrect / atsTotal * 100).toFixed(2) : 'N/A';
    
    console.log(`Evaluation Results:
    Overall Company Accuracy: ${companyAccuracy}%
    Position Accuracy: ${positionAccuracy}%
    ATS-specific Accuracy: ${atsAccuracy}%`);

    trainedClassifiers = { companyClassifier, positionClassifier };
    return trainedClassifiers;
}

export function classifyEmail(email: {
    subject: string,
    content: string,
    from: string
}): {
    company: string,
    position: string
} {
    if (!trainedClassifiers) {
        console.log('Classifiers not trained, using pattern matching fallback');
        return handleFallbackParsing(email);
    }

    try {
        const { companyClassifier, positionClassifier } = trainedClassifiers;
        const domain = extractEmailDomain(email.from);
        const isATS = atsProviders.some(provider => 
            provider.domains.includes(domain)
        );
        
        // Prepare features with ATS awareness
        const companyFeatures = cleanText(
            `${email.subject} ${email.content} ${email.from} ${domain} ${
                isATS ? 'ats_email' : 'other_email'
            }`
        );
        const positionFeatures = cleanText(
            `${email.subject} ${email.content} ${
                isATS ? 'ats_position' : 'other_position'
            }`
        );

        const company = companyClassifier.classify(companyFeatures);
        const position = positionClassifier.classify(positionFeatures);

        return { 
            company: normalizeCompanyName(company, email.from), 
            position 
        };
    } catch (error) {
        console.error('Classification error:', error);
        return handleFallbackParsing(email);
    }
}

function handleFallbackParsing(email: { subject: string, content: string, from: string }) {
    // First check if it's from a known ATS
    const domain = extractEmailDomain(email.from);
    const atsProvider = atsProviders.find(provider => 
        provider.domains.includes(domain)
    );

    if (atsProvider) {
        console.log(`Using ${atsProvider.name} specific parsing`);
        // Add ATS-specific parsing logic here if needed
    }

    // Then try pattern matching
    const patterns = [
        {
            name: 'LinkedIn',
            match: (email: any) => {
                const match = email.content.match(/Your application was sent to ([^͏]+)/);
                return match ? { company: match[1].trim() } : null;
            }
        },
        {
            name: 'Lensa',
            match: (email: any) => {
                if (email.from.toLowerCase().includes('lensa')) {
                    const match = email.content.match(/(.*?)(?:\s*,|\s+and)/);
                    return match ? { company: match[1].trim() } : null;
                }
                return null;
            }
        }
    ];

    for (const pattern of patterns) {
        const result = pattern.match(email);
        if (result) {
            console.log(`Matched ${pattern.name} pattern`);
            return {
                company: result.company,
                position: 'Software Engineer'
            };
        }
    }

    return {
        company: 'Unknown Company',
        position: 'Software Engineer'
    };
}

// Initialize on module load
console.log('Initializing email parser...');
(async () => {
    try {
        const classifiers = await trainClassifiers();
        if (classifiers) {
            console.log('Successfully initialized classifiers');
        } else {
            console.log('Failed to initialize classifiers, will use fallback parsing');
        }
    } catch (error) {
        console.error('Initialization error:', error);
    }
})();