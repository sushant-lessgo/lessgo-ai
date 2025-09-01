// scripts/testEnv.ts - Development environment testing script
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// This script is for development environment testing only
// Console logs removed for production build

// Strategy 1: Default
dotenv.config();

// Strategy 2: Explicit .env.local
const result1 = dotenv.config({ path: '.env.local' });

// Strategy 3: Absolute path
const envPath = path.join(process.cwd(), '.env.local');
const result2 = dotenv.config({ path: envPath });

// Strategy 4: Check if file exists
const fileExists = fs.existsSync('.env.local');

if (fileExists) {
  const content = fs.readFileSync('.env.local', 'utf8');
  // Environment file validation logic preserved
  const hasOpenAI = content.includes('OPENAI_API_KEY');
}