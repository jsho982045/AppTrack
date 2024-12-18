import natural from 'natural';
import { removeStopwords } from 'stopword';
import { ITrainingEmail } from '../models/TrainingEmail';

const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;

const preprocessEmail = (text: string): string[] => {
    const lowered = text.toLowerCase();

    const tokens: string[] = tokenizer.tokenize(lowered) || [];

    const withoutStopwords: string[] = removeStopwords(tokens);

    const stemmed: string[] = withoutStopwords.map((token: string): string => stemmer.stem(token));

    return stemmed;
};

export const extractFeatures = async (email: ITrainingEmail) => {

    const fullText = `${email.subject} ${email.content}`;

    const processedTokens = preprocessEmail(fullText);

    console.log('Processed email:', {
        original: fullText,
        processed: processedTokens
    });

    return processedTokens;
}