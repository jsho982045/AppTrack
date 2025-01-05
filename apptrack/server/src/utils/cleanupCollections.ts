// server/src/utils/cleanupCollections.ts
import { MongoClient } from 'mongodb';
import { parseJobEmail } from './jobParser';

async function cleanupCollections() {
    try {
        const client = await MongoClient.connect(process.env.MONGODB_URI!);
        const db = client.db('test');
        
        // First, clear the jobs collection
        const jobsCollection = db.collection('jobapplications');
        await jobsCollection.deleteMany({});
        
        // Get all training emails and reprocess them
        const trainingCollection = db.collection('trainingemails');
        const emails = await trainingCollection.find({}).toArray();
        const applicationEmails = emails.filter(email => email.isApplicationEmail === true);
        
        console.log(`Processing ${emails.length} emails...`);
        let successCount = 0;
        
        for (const email of applicationEmails) {
            const parsedJob = parseJobEmail({
                subject: email.subject,
                content: email.content,
                from: email.from,
                receivedDate: email.receivedDate || new Date(),
                emailId: email.emailId || email._id.toString()
            });
            
            // Only save valid entries
            if (parsedJob.company !== 'Unknown Company' && 
                parsedJob.position !== 'Position Not Found') {
                await jobsCollection.insertOne(parsedJob);
                successCount++;
                console.log(`Processed: ${parsedJob.company} - ${parsedJob.position}`);
            }
        }
        
        console.log(`Successfully processed ${successCount} out of ${emails.length} emails`);
        await client.close();
        
    } catch (error) {
        console.error('Cleanup failed:', error);
    }
}

console.log('Starting collection cleanup...');
cleanupCollections().then(() => console.log('Cleanup complete'));