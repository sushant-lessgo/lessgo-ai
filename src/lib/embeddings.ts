// lib/embeddings.ts
import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

const prisma = new PrismaClient();

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not found in environment');
    }

    logger.dev('🔑 Generating embedding for:', () => text.substring(0, 50) + '...');

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      logger.error('OpenAI API Error:', () => errorData);
      throw new Error(`OpenAI API Error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    
    if (!result.data || !result.data[0] || !result.data[0].embedding) {
      throw new Error('Invalid response format from OpenAI embeddings API');
    }

    logger.debug('✅ Embedding generated successfully');
    return result.data[0].embedding;
    
  } catch (error) {
    logger.error('Error generating embedding:', () => error);
    throw error;
  }
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export interface SemanticMatch {
  value: string;
  confidence: number;
  metadata?: any;
}

export async function findSemanticMatches(
  query: string,
  fieldType: string,
  topK: number = 3
): Promise<SemanticMatch[]> {
  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);
    
    // Get all embeddings for this field type
    const taxonomyEmbeddings = await prisma.taxonomyEmbedding.findMany({
      where: { fieldType },
    });
    
    if (taxonomyEmbeddings.length === 0) {
      logger.warn(`No embeddings found for field type: ${fieldType}`);
      return [];
    }
    
    // Calculate similarities
    const similarities = taxonomyEmbeddings.map(item => ({
      value: item.value,
      confidence: cosineSimilarity(queryEmbedding, item.embedding),
      metadata: item.metadata,
    }));
    
    // Sort by confidence and return top K
    return similarities
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, topK);
      
  } catch (error) {
    logger.error('Error finding semantic matches:', () => error);
    return [];
  }
}

export async function getBestSemanticMatch(
  query: string,
  fieldType: string,
  threshold: number = 0.7
): Promise<SemanticMatch | null> {
  const matches = await findSemanticMatches(query, fieldType, 1);
  const bestMatch = matches[0];
  
  return bestMatch && bestMatch.confidence >= threshold ? bestMatch : null;
}