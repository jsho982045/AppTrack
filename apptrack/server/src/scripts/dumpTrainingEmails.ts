// server/src/scripts/dumpTrainingEmails.ts

import mongoose from 'mongoose';
import { TrainingEmail } from '../models/TrainingEmail';
import dotenv from 'dotenv';

dotenv.config();

(async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI!);

        const allDocs = await TrainingEmail.find({});

        console.log(JSON.stringify(allDocs, null, 2));

        process.exit(0);
    } catch(err) {
        console.log(err);
        process.exit(1);
    }
})();