#!/usr/bin/env node

require('dotenv').config();
const { google } = require('googleapis');

async function testYouTubeAPIDirect() {
  console.log('🔍 Testing YouTube API Directly...\n');
  
  // Check API key
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.log('❌ No YOUTUBE_API_KEY found in environment');
    return;
  }
  
  console.log(`✅ API Key found: ${apiKey.substring(0, 10)}...`);
  
  // Initialize YouTube client
  const youtube = google.youtube({
    version: 'v3',
    auth: apiKey
  });
  
  try {
    console.log('\n📹 Searching for "Figma button tutorial"...');
    
    const response = await youtube.search.list({
      part: ['snippet'],
      q: 'Figma button tutorial',
      maxResults: 3,
      type: ['video'],
      relevanceLanguage: 'en',
      order: 'relevance',
      safeSearch: 'strict'
    });
    
    if (response.data.items && response.data.items.length > 0) {
      console.log(`\n✅ Found ${response.data.items.length} videos:\n`);
      
      response.data.items.forEach((item, idx) => {
        console.log(`${idx + 1}. ${item.snippet?.title}`);
        console.log(`   Channel: ${item.snippet?.channelTitle}`);
        console.log(`   Video ID: ${item.id?.videoId}`);
        console.log(`   Published: ${item.snippet?.publishedAt}`);
        console.log();
      });
    } else {
      console.log('⚠️  No videos found');
    }
    
  } catch (error) {
    console.error('❌ YouTube API Error:', error.message);
    
    if (error.response) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    
    if (error.message.includes('API key')) {
      console.log('\n💡 Possible issues:');
      console.log('1. API key might be invalid or expired');
      console.log('2. YouTube Data API v3 might not be enabled for this key');
      console.log('3. API key might have usage restrictions');
      console.log('\nTo fix:');
      console.log('1. Go to https://console.cloud.google.com');
      console.log('2. Enable "YouTube Data API v3"');
      console.log('3. Create a new API key or check existing key restrictions');
    }
  }
}

testYouTubeAPIDirect().catch(console.error);