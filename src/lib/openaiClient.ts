import { OpenAI } from 'openai';

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const mistral = new OpenAI({
  apiKey: process.env.NEBIUS_API_KEY,
  baseURL: 'https://api.mistral.ai/v1',
});
