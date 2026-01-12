import { config } from 'dotenv';
import { kv } from '@vercel/kv';

// Load environment variables
config({ path: '.env.local' });

async function checkKV() {
  const slug = process.argv[2] || 'page1';
  const host = `${slug}.lessgo.ai`;
  const routeKey = `route:${host}:/`;

  console.log('🔍 Checking KV entry for:', routeKey);
  console.log('');

  try {
    // Check if key exists
    const exists = await kv.exists(routeKey);
    console.log('✓ Key exists:', exists);

    if (exists) {
      // Get the value
      const route = await kv.get(routeKey);
      console.log('');
      console.log('📦 Route Config:');
      console.log(JSON.stringify(route, null, 2));
    } else {
      console.log('');
      console.log('❌ No KV entry found!');
      console.log('Expected key:', routeKey);
    }
  } catch (error) {
    console.error('❌ Error checking KV:', error);
  }
}

checkKV();
