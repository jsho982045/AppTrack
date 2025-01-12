// server/src/utils/inspectTrainingData.ts
import path from 'path';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/test';

async function inspectTrainingData() {
    console.log('Using MongoDB URI:', MONGODB_URI.replace(/mongodb\+srv:\/\/([^:]+):[^@]+@/, 'mongodb+srv://$1:****@')); // Safely log URI

    try {
        const client = await MongoClient.connect(MONGODB_URI);
        const db = client.db('test');
        const trainingCollection = db.collection('trainingemails');
        
        // 1. Basic Collection Info
        const totalDocs = await trainingCollection.countDocuments();
        console.log(`\nTotal documents in collection: ${totalDocs}`);

        // 2. Sample Document Analysis
        const sampleDoc = await trainingCollection.findOne({});
        if (sampleDoc) {
            console.log('\nSample Document Structure:');
            // Safely print document without sensitive info
            const sanitizedDoc = { ...sampleDoc };
            if (sanitizedDoc.password) sanitizedDoc.password = '****';
            console.log(JSON.stringify(sanitizedDoc, null, 2));
            
            console.log('\nFields present in sample document:');
            Object.keys(sampleDoc).forEach(key => {
                const value = sampleDoc[key];
                console.log(`- ${key}: ${typeof value} (${value ? 'has value' : 'empty'})`);
            });
        } else {
            console.log('No documents found in collection');
        }

        // 3. Field Analysis
        if (totalDocs > 0) {
            const pipeline = [
                {
                    $project: {
                        subjectExists: { $cond: [{ $ifNull: ['$subject', false] }, 1, 0] },
                        contentExists: { $cond: [{ $ifNull: ['$content', false] }, 1, 0] },
                        fromExists: { $cond: [{ $ifNull: ['$from', false] }, 1, 0] },
                        companyExists: { $cond: [{ $ifNull: ['$company', false] }, 1, 0] },
                        positionExists: { $cond: [{ $ifNull: ['$position', false] }, 1, 0] },
                        hasDefaultCompany: { 
                            $cond: [{ $eq: ['$company', 'Unknown Company'] }, 1, 0] 
                        },
                        hasDefaultPosition: { 
                            $cond: [{ $eq: ['$position', 'Software Engineer'] }, 1, 0] 
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalDocs: { $sum: 1 },
                        withSubject: { $sum: '$subjectExists' },
                        withContent: { $sum: '$contentExists' },
                        withFrom: { $sum: '$fromExists' },
                        withCompany: { $sum: '$companyExists' },
                        withPosition: { $sum: '$positionExists' },
                        defaultCompany: { $sum: '$hasDefaultCompany' },
                        defaultPosition: { $sum: '$hasDefaultPosition' }
                    }
                }
            ];

            const [stats] = await trainingCollection.aggregate(pipeline).toArray();
            if (stats) {
                console.log('\nField Statistics:');
                console.log(`Documents with subject: ${stats.withSubject}/${totalDocs}`);
                console.log(`Documents with content: ${stats.withContent}/${totalDocs}`);
                console.log(`Documents with from: ${stats.withFrom}/${totalDocs}`);
                console.log(`Documents with company: ${stats.withCompany}/${totalDocs}`);
                console.log(`Documents with position: ${stats.withPosition}/${totalDocs}`);
                console.log(`\nQuality Metrics:`);
                console.log(`Documents with 'Unknown Company': ${stats.defaultCompany}/${totalDocs}`);
                console.log(`Documents with default position: ${stats.defaultPosition}/${totalDocs}`);
            }
        }

        await client.close();
    } catch (error) {
        console.error('Inspection failed:', error);
        if (error instanceof Error) {
            console.error('Error details:', error.message);
            console.error('Stack trace:', error.stack);
        }
    }
}

console.log('Starting training data inspection...');
inspectTrainingData()
    .then(() => console.log('Inspection complete'))
    .catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });