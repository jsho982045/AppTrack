declare module 'stopword' {
    export function removeStopwords(tokens: string[]): string[];
    export const eng: string[];
}