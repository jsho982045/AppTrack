// apptrack/server/src/ml/emailProcessor.ts

import natural from 'natural';
import { removeStopwords } from 'stopword';
import { ITrainingEmail } from '../models/TrainingEmail';
import * as tf from '@tensorflow/tfjs-node'

export class EmailProcessor {
    private tokenizer: natural.WordTokenizer
    private stemmer: any;
    private vocabulary: Map<string, number>;
    private maxSequenceLength: number;
    private model: tf.LayersModel | null;
    public extractFeatures(text: string): string[] {
        return this.preprocessText(text);
    }

    constructor(maxSequenceLength: number = 100) {
        this.tokenizer = new natural.WordTokenizer();
        this.stemmer = natural.PorterStemmer;
        this.vocabulary = new Map();
        this.maxSequenceLength = maxSequenceLength;
        this.model = null;
    }

private preprocessText(text: string): string[]{
    const lowered = text.toLowerCase();
    const tokens: string[] = this.tokenizer.tokenize(lowered) || [];
    const withoutStopwords = removeStopwords(tokens);
    return withoutStopwords.map(token => this.stemmer.stem(token));
};

async buildVocabulary(emails: ITrainingEmail[]): Promise<void> {
    const allTokens = new Set<string>();
    for (const email of emails) {
        const fullText = `${email.subject} ${email.content}`;
        const tokens = this.preprocessText(fullText);
        tokens.forEach(token => allTokens.add(token));
    }

    Array.from(allTokens).forEach((token, index) => {
        this.vocabulary.set(token, index + 1);
    });
}

private textToSequence(text: string): number[] {
    const tokens = this.preprocessText(text);
    const sequence = tokens.map(token => this.vocabulary.get(token) || 0);

    if (sequence.length > this.maxSequenceLength) {
        return sequence.slice(0, this.maxSequenceLength);
    }
    while (sequence.length < this.maxSequenceLength) {
        sequence.push(0);
    }
    return sequence;
}


async createModel(): Promise<tf.LayersModel> {
    const model = tf.sequential();
    
    model.add(tf.layers.embedding({
        inputDim: this.vocabulary.size + 1,
        outputDim: 32,
        inputLength: this.maxSequenceLength
    }));

    model.add(tf.layers.globalAveragePooling1d());
    model.add(tf.layers.dense({ units: 64, activation: 'relu' }));
    model.add(tf.layers.dropout({ rate: 0.5 }));
    model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));

    model.compile({
        optimizer: 'adam',
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
    });

    this.model = model;
    return model;
}

async trainModel(emails: ITrainingEmail[]): Promise<void> {
    if (!this.model) {
        await this.createModel();
    }

    const sequences = emails.map(email => 
        this.textToSequence(`${email.subject} ${email.content}`));
    const labels = emails.map(email => email.isApplicationEmail ? 1 : 0);

    const xTrain = tf.tensor2d(sequences);
    const yTrain = tf.tensor1d(labels);

    await this.model!.fit(xTrain, yTrain, {
        epochs: 10,
        validationSplit: 0.2,
        callbacks: {
            onEpochEnd: (epoch, logs) => {
                console.log(`Epoch ${epoch + 1}: loss = ${logs?.loss.toFixed(4)}, accuracy = ${logs?.acc.toFixed(4)}`);
            }
        }
    });

    // Cleanup tensors
    xTrain.dispose();
    yTrain.dispose();
}


async predictEmail(email: { subject: string, content: string }): Promise<{
    isJobApplication: boolean;
    confidence: number;
}> {
    if (!this.model || this.vocabulary.size === 0) {
        throw new Error('Model not trained or vocabulary not built');
    }

    const sequence = this.textToSequence(`${email.subject} ${email.content}`);
    const input = tf.tensor2d([sequence]);
    
    const prediction = this.model.predict(input) as tf.Tensor;
    const confidence = (await prediction.data())[0];
    
    // Cleanup
    input.dispose();
    prediction.dispose();

    return {
        isJobApplication: confidence > 0.5,
        confidence
    };
}

async saveModel(path: string): Promise<void> {
    if (!this.model) {
        throw new Error('No model to save');
    }
    await this.model.save(`file://${path}`);
}

async loadModel(path: string): Promise<void> {
    this.model = await tf.loadLayersModel(`file://${path}`);
    }
}

export class EmailFeatureExtractor {
    private processor: EmailProcessor;

    constructor() {
        this.processor = new EmailProcessor();
    }
     async extractFeatures(email: ITrainingEmail): Promise<string[]> {
        const fullText = `${email.subject} ${email.content}`;
    return this.processor.extractFeatures(fullText);
     }
}


