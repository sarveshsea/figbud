#!/usr/bin/env node

const https = require('https');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

console.log('🔍 Testing Supabase API directly...\n');
console.log(`URL: ${supabaseUrl}`);
console.log(`Anon Key: ${supabaseAnonKey?.substring(0, 50)}...`);
console.log(`Service Key: ${supabaseServiceKey?.substring(0, 50)}...`);

// Test with REST API
async function testRestAPI() {
  const url = new URL(`${supabaseUrl}/rest/v1/chat_sessions`);
  url.searchParams.append('select', '*');
  url.searchParams.append('limit', '1');

  const options = {
    method: 'GET',
    headers: {
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    }
  };

  return new Promise((resolve, reject) => {
    https.get(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`\nResponse Status: ${res.statusCode}`);
        console.log(`Response Headers:`, res.headers);
        console.log(`Response Body:`, data);
        
        if (res.statusCode === 200) {
          console.log('✅ Connection successful!');
        } else {
          console.log('❌ Connection failed');
        }
        resolve();
      });
    }).on('error', (err) => {
      console.error('❌ Request error:', err);
      reject(err);
    });
  });
}

// Test auth endpoint
async function testAuth() {
  console.log('\n\n🔐 Testing Auth Endpoint...');
  
  const url = new URL(`${supabaseUrl}/auth/v1/health`);
  
  return new Promise((resolve) => {
    https.get(url, (res) => {
      console.log(`Auth Health Status: ${res.statusCode}`);
      resolve();
    });
  });
}

async function runTests() {
  await testRestAPI();
  await testAuth();
  
  console.log('\n\n📝 Next Steps:');
  console.log('1. If you see "relation does not exist", create tables in Supabase SQL editor');
  console.log('2. If you see "Invalid API key", check your Supabase project settings');
  console.log('3. Make sure the API keys are from the correct project');
}

runTests().catch(console.error);