// diagnostics.ts
import { MongoClient, ObjectId } from 'mongodb';
import { EmailData, cleanText, extractEmailDomain, normalizeCompanyName  } from './trainParser';
import { atsProviders, parseJobEmail } from './jobParser';
import { Sample } from 'natural';

async function processRawEmail(doc: any) {
    if (!doc) return null;

    // Try to parse the email first
    const parsedInfo = parseJobEmail({
        subject: doc.subject,
        content: doc.content,
        from: doc.from,
        receivedDate: doc.receivedDate || new Date(),
        emailId: doc.emailId || 'test'
    });

    return {
        ...doc,
        parsedCompany: parsedInfo.company,
        parsedPosition: parsedInfo.position,
        originalContent: {
            subject: doc.subject,
            content: doc.content?.substring(0, 300), // First 300 chars for inspection
            from: doc.from
        }
    };
}

async function inspectSingleDocument() {
    const client = await MongoClient.connect(process.env.MONGODB_URI!);
    const db = client.db('test');
    const collection = db.collection('trainingemails');
    
    // Get a few samples to analyze
    const samples = await collection.find().limit(3).toArray();
    
    console.log('\nAnalyzing Sample Training Emails:');
    for (const doc of samples) {
        const processed = await processRawEmail(doc);
        if (processed) {
            console.log('\n=== Email Analysis ===');
            console.log('Original Data:');
            console.log('From:', processed.originalContent.from);
            console.log('Subject:', processed.originalContent.subject);
            console.log('Content Preview:', processed.originalContent.content);
            
            console.log('\nParsed Results:');
            console.log('Company:', processed.parsedCompany);
            console.log('Position:', processed.parsedPosition);
            console.log('Is Valid:', processed.parsedCompany !== 'Unknown Company' && 
                                  processed.parsedPosition !== 'Software Engineer');
        }
    }
    
    await client.close();
}



async function runDiagnostics() {
    try {
        const client = await MongoClient.connect(process.env.MONGODB_URI!);
        const db = client.db('test');
        console.log('\n=== Training Data Diagnostics ===\n');

        // 1. Collection Statistics
        console.log('Collection Statistics:');
        const jobsCollection = db.collection('jobapplications');
        const trainingCollection = db.collection('trainingemails');
        
        const jobsCount = await jobsCollection.countDocuments();
        const trainingCount = await trainingCollection.countDocuments();
        
        console.log(`- Jobs Collection: ${jobsCount} documents`);
        console.log(`- Training Collection: ${trainingCount} documents\n`);

        // 2. Data Quality Analysis
        console.log('Data Quality Analysis:');
        const allEmails = await jobsCollection.find({}).toArray();
        
        const stats = {
            total: allEmails.length,
            missingCompany: 0,
            missingPosition: 0,
            unknownCompany: 0,
            defaultPosition: 0,
            validEntries: 0,
            atsEmails: 0,
            nonAtsEmails: 0,
            companyDistribution: new Map<string, number>(),
            positionDistribution: new Map<string, number>()
        };

        const sampleDoc = await trainingCollection.findOne({});
            if (sampleDoc) {
                console.log('\nTesting Parser:');
                const parsedInfo = parseJobEmail({
                    subject: sampleDoc.subject,
                    content: sampleDoc.content,
                    from: sampleDoc.from,
                    receivedDate: sampleDoc.receivedDate || new Date(),
                    emailId: sampleDoc.emailId || 'test'
                });
            
                console.log('\nParsing Results:');
                console.log('Original From:', sampleDoc.from);
                console.log('Original Subject:', sampleDoc.subject);
                console.log('Parsed Company:', parsedInfo.company);
                console.log('Parsed Position:', parsedInfo.position);
            }

        for (const email of allEmails) {
            // Check basic fields
            if (!email.company) stats.missingCompany++;
            if (!email.position) stats.missingPosition++;
            if (email.company === 'Unknown Company') stats.unknownCompany++;
            if (email.position === 'Software Engineer') stats.defaultPosition++;
            
            // Check if it's from an ATS
            const domain = extractEmailDomain(email.from);
            const isATS = atsProviders.some(p => p.domains.some(d => domain.includes(d)));
            if (isATS) stats.atsEmails++;
            else stats.nonAtsEmails++;

            // Track distributions
            if (email.company) {
                const normalized = normalizeCompanyName(email.company, email.from);
                stats.companyDistribution.set(
                    normalized,
                    (stats.companyDistribution.get(normalized) || 0) + 1
                );
            }
            if (email.position) {
                stats.positionDistribution.set(
                    email.position,
                    (stats.positionDistribution.get(email.position) || 0) + 1
                );
            }

            // Check if entry is valid for training
            if (email.company && 
                email.company !== 'Unknown Company' && 
                email.position && 
                email.position !== 'Position Not Found') {
                stats.validEntries++;
            }
        }

        // Output Results
        console.log(`
Data Quality Metrics:
- Total Entries: ${stats.total}
- Valid Training Entries: ${stats.validEntries} (${((stats.validEntries/stats.total)*100).toFixed(1)}%)
- Missing Company: ${stats.missingCompany} (${((stats.missingCompany/stats.total)*100).toFixed(1)}%)
- Unknown Company: ${stats.unknownCompany} (${((stats.unknownCompany/stats.total)*100).toFixed(1)}%)
- Default Position: ${stats.defaultPosition} (${((stats.defaultPosition/stats.total)*100).toFixed(1)}%)
- ATS Emails: ${stats.atsEmails} (${((stats.atsEmails/stats.total)*100).toFixed(1)}%)
- Non-ATS Emails: ${stats.nonAtsEmails} (${((stats.nonAtsEmails/stats.total)*100).toFixed(1)}%)

Top 5 Companies:
${Array.from(stats.companyDistribution.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([company, count]) => `- ${company}: ${count} entries`)
    .join('\n')}

Top 5 Positions:
${Array.from(stats.positionDistribution.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([position, count]) => `- ${position}: ${count} entries`)
    .join('\n')}
`);

        // 3. Sample Analysis
        console.log('\nSample Entry Analysis:');
        const sampleEmail = allEmails[0];
        if (sampleEmail) {
            console.log(`
Sample Entry Details:
- Subject: ${sampleEmail.subject}
- From: ${sampleEmail.from}
- Company (Raw): ${sampleEmail.company}
- Company (Normalized): ${normalizeCompanyName(sampleEmail.company || '', sampleEmail.from)}
- Position: ${sampleEmail.position}
- Is ATS: ${sampleEmail.from ? atsProviders.some(p => p.domains.some(d => sampleEmail.from.includes(d))) : false}
`);
        }

        // Close connection
        await client.close();

    } catch (error) {
        console.error('Diagnostics failed:', error);
    }
}

async function runAllDiagnostics() {
    await inspectSingleDocument();
    await runDiagnostics();
}

// Run diagnostics
console.log('Starting diagnostics...');
runAllDiagnostics()
    .then(() => console.log('Diagnostics complete'))
    .catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });