// scripts/testEnv.ts
import dotenv from 'dotenv';
import path from 'path';

console.log('📁 Current working directory:', process.cwd());
console.log('📁 Script directory:', __dirname);

// Try different approaches to load .env.local
console.log('\n🔍 Trying different env loading strategies:');

// Strategy 1: Default
console.log('\n1. Default dotenv.config():');
dotenv.config();
console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);

// Strategy 2: Explicit .env.local
console.log('\n2. Explicit .env.local:');
const result1 = dotenv.config({ path: '.env.local' });
console.log('Load result:', result1.error ? result1.error.message : 'Success');
console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);

// Strategy 3: Absolute path
console.log('\n3. Absolute path to .env.local:');
const envPath = path.join(process.cwd(), '.env.local');
console.log('Trying path:', envPath);
const result2 = dotenv.config({ path: envPath });
console.log('Load result:', result2.error ? result2.error.message : 'Success');
console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);

// Strategy 4: Check if file exists
console.log('\n4. File existence check:');
import fs from 'fs';
const fileExists = fs.existsSync('.env.local');
console.log('.env.local exists:', fileExists);

if (fileExists) {
  const content = fs.readFileSync('.env.local', 'utf8');
  console.log('File content preview (first 100 chars):');
  console.log(content.substring(0, 100));
  console.log('Contains OPENAI_API_KEY:', content.includes('OPENAI_API_KEY'));
}

console.log('\n🔍 Final Environment Check:');
console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
console.log('OPENAI_API_KEY length:', process.env.OPENAI_API_KEY?.length || 0);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);