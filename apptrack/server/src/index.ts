import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { getAllApplications, createApplication } from './controllers/JobApplication';
import cors from 'cors';


dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
    console.log(`${req.method} request to ${req.url}`);
    next();
});

mongoose.connect(process.env.MONGODB_URI!)
    .then(() => {
        console.log('Connected to MongoDB Atlas successfully');
    })
    .catch((error => {
        console.error('MongoDB connection error: ', error);
    }));

app.get('/api/applications', getAllApplications);
app.post('/api/applications', createApplication);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
})