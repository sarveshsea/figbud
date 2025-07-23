const axios = require('axios');
const { YouTubeService } = require('../server/services/youtube');
require('dotenv').config();

// Test videos with known timestamps
const TEST_VIDEOS = [
  {
    id: 'jFeu-x7X208',
    title: 'Figma for Beginners: Get Started in Just 24 Minutes',
    channel: 'Flux Academy',
    hasChapters: true,
    expectedTimestamps: ['Introduction', 'Getting Started', 'Interface Overview']
  },
  {
    id: 'FTFaQWZBqQ8',
    title: 'Figma Tutorial for Beginners - Complete Guide',
    channel: 'The Futur Academy',
    hasChapters: true
  },
  {
    id: 'DSrbwCHB6XA',
    title: 'Learn Figma in 20 Minutes',
    channel: 'Mike Locke',
    hasChapters: false
  }
];

// Test timestamp formats
const TEST_DESCRIPTIONS = [
  {
    name: 'Standard format',
    description: `
0:00 - Introduction
1:30 - Getting Started
3:45 - Main Content
10:20 - Advanced Features
15:00 - Conclusion
    `,
    expectedCount: 5
  },
  {
    name: 'Various formats',
    description: `
[0:00] Introduction
1:30 | Getting Started
Main Content @ 3:45
4:20 → Advanced stuff
【5:30】 Japanese style
• 6:00 - Bullet points
➜ 7:15 Next section
⏱ 8:30 Timer style
    `,
    expectedCount: 8
  },
  {
    name: 'Numbered list',
    description: `
Timestamps:
1. Introduction - 0:00
2. Setup - 2:15
3. Basic Concepts - 5:30
4. Advanced Topics - 12:00
5. Wrap up - 18:45
    `,
    expectedCount: 5
  }
];

async function testTimestampExtraction() {
  console.log('🧪 Testing YouTube Timestamp Extraction\n');
  console.log('=' .repeat(60) + '\n');
  
  // Test 1: Extract timestamps from various formats
  console.log('1️⃣ Testing timestamp format extraction...\n');
  
  for (const test of TEST_DESCRIPTIONS) {
    console.log(`Testing: ${test.name}`);
    const timestamps = await YouTubeService.extractTimestamps(
      'test-video-id',
      test.description,
      'Test Video',
      'Test Channel'
    );
    
    console.log(`✅ Found ${timestamps.length} timestamps (expected ${test.expectedCount})`);
    
    if (timestamps.length !== test.expectedCount) {
      console.log('⚠️  Count mismatch!');
      console.log('Found timestamps:', timestamps.map(t => `${t.time} - ${t.title}`));
    }
    
    // Verify timestamp structure
    const hasValidStructure = timestamps.every(ts => 
      ts.time && ts.seconds >= 0 && ts.title && ts.url
    );
    
    if (hasValidStructure) {
      console.log('✅ All timestamps have valid structure');
    } else {
      console.log('❌ Some timestamps have invalid structure');
    }
    
    console.log('');
  }
  
  console.log('=' .repeat(60) + '\n');
}

async function testYouTubeSearch() {
  console.log('2️⃣ Testing YouTube search with real API...\n');
  
  const testQueries = [
    'button Figma tutorial beginner',
    'card component Figma',
    'auto layout Figma',
    'variants Figma tutorial'
  ];
  
  for (const query of testQueries) {
    console.log(`\nSearching for: "${query}"`);
    console.log('-'.repeat(40));
    
    try {
      const tutorials = await YouTubeService.searchTutorials(query, 'beginner', 3);
      
      console.log(`Found ${tutorials.length} tutorials:`);
      
      tutorials.forEach((tutorial, index) => {
        console.log(`\n${index + 1}. ${tutorial.title}`);
        console.log(`   Channel: ${tutorial.channelTitle}`);
        console.log(`   Duration: ${Math.floor(tutorial.duration / 60)}m ${tutorial.duration % 60}s`);
        console.log(`   Views: ${tutorial.views?.toLocaleString() || 'N/A'}`);
        console.log(`   Timestamps: ${tutorial.timestamps?.length || 0}`);
        
        // Show first 3 timestamps if available
        if (tutorial.timestamps && tutorial.timestamps.length > 0) {
          console.log('   First timestamps:');
          tutorial.timestamps.slice(0, 3).forEach(ts => {
            console.log(`     - ${ts.time} ${ts.description}`);
          });
        }
      });
      
    } catch (error) {
      console.error('❌ Search failed:', error.message);
    }
  }
  
  console.log('\n' + '=' .repeat(60) + '\n');
}

async function testChannelPrioritization() {
  console.log('3️⃣ Testing Figma channel prioritization...\n');
  
  try {
    const results = await YouTubeService.searchTutorials('component', undefined, 10);
    
    console.log('Top 10 results by channel:');
    console.log('-'.repeat(40));
    
    const channelCounts = {};
    results.forEach((tutorial, index) => {
      const channel = tutorial.channelTitle;
      channelCounts[channel] = (channelCounts[channel] || 0) + 1;
      
      console.log(`${index + 1}. [${channel}] ${tutorial.title.substring(0, 50)}...`);
    });
    
    console.log('\nChannel distribution:');
    Object.entries(channelCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([channel, count]) => {
        console.log(`  ${channel}: ${count} videos`);
      });
    
  } catch (error) {
    console.error('❌ Channel prioritization test failed:', error.message);
  }
  
  console.log('\n' + '=' .repeat(60) + '\n');
}

async function testAITimestampGeneration() {
  console.log('4️⃣ Testing AI timestamp generation fallback...\n');
  
  const testCases = [
    { title: 'Quick Figma Tips', duration: 180 }, // 3 minutes
    { title: 'Figma Basics Tutorial', duration: 600 }, // 10 minutes
    { title: 'Complete Figma Course', duration: 3600 } // 60 minutes
  ];
  
  for (const testCase of testCases) {
    console.log(`Video: "${testCase.title}" (${testCase.duration}s)`);
    
    const timestamps = YouTubeService.generateAITimestamps(
      testCase.title,
      testCase.duration,
      'This video has no timestamps in description'
    );
    
    console.log(`Generated ${timestamps.length} timestamps:`);
    timestamps.forEach(ts => {
      console.log(`  ${ts.time} - ${ts.title}`);
    });
    console.log('');
  }
  
  console.log('=' .repeat(60) + '\n');
}

async function testChatIntegration() {
  console.log('5️⃣ Testing chat integration with YouTube features...\n');
  
  const testMessages = [
    {
      message: 'Show me a tutorial on creating buttons in Figma',
      expectedFeatures: ['tutorial search', 'component detection']
    },
    {
      message: 'I need help with auto layout',
      expectedFeatures: ['tutorial search', 'guidance']
    }
  ];
  
  for (const test of testMessages) {
    console.log(`User: "${test.message}"`);
    
    try {
      const response = await axios.post('http://localhost:3000/api/chat/message', {
        message: test.message,
        context: {},
        widgetSessionId: 'test-widget-' + Date.now()
      });
      
      if (response.data.success) {
        console.log('✅ Response received');
        console.log('- Has tutorials:', !!(response.data.metadata?.tutorials?.length > 0));
        console.log('- Has components:', !!(response.data.metadata?.components?.length > 0));
        console.log('- Has guidance:', !!(response.data.metadata?.guidance?.length > 0));
        
        if (response.data.metadata?.tutorials?.length > 0) {
          const firstTutorial = response.data.metadata.tutorials[0];
          console.log(`- First tutorial: ${firstTutorial.title || firstTutorial.searchQuery}`);
          console.log(`  Timestamps: ${firstTutorial.timestamps?.length || 0}`);
        }
      }
      
    } catch (error) {
      console.error('❌ Chat integration failed:', error.message);
    }
    
    console.log('');
  }
  
  console.log('=' .repeat(60) + '\n');
}

async function testSupabaseCaching() {
  console.log('6️⃣ Testing Supabase timestamp caching...\n');
  
  const testVideoId = 'test-cache-' + Date.now();
  const testTimestamps = [
    { time: '0:00', seconds: 0, title: 'Intro', url: 'https://youtube.com/watch?v=test&t=0s' },
    { time: '1:30', seconds: 90, title: 'Main Content', url: 'https://youtube.com/watch?v=test&t=90s' }
  ];
  
  console.log('First extraction (should cache):');
  const firstExtraction = await YouTubeService.extractTimestamps(
    testVideoId,
    '0:00 - Intro\n1:30 - Main Content',
    'Test Video',
    'Test Channel'
  );
  console.log(`✅ Extracted ${firstExtraction.length} timestamps`);
  
  console.log('\nSecond extraction (should be from cache):');
  const secondExtraction = await YouTubeService.extractTimestamps(
    testVideoId,
    '', // Empty description to ensure it comes from cache
    'Test Video',
    'Test Channel'
  );
  console.log(`✅ Retrieved ${secondExtraction.length} timestamps from cache`);
  
  // Verify they match
  const match = JSON.stringify(firstExtraction) === JSON.stringify(secondExtraction);
  console.log(`Cache consistency: ${match ? '✅ PASS' : '❌ FAIL'}`);
  
  console.log('\n' + '=' .repeat(60) + '\n');
}

// Main test runner
async function runAllTests() {
  console.log('🚀 FigBud YouTube Feature Test Suite\n');
  console.log('Environment:');
  console.log('- YouTube API Key:', process.env.YOUTUBE_API_KEY ? '✅ Set' : '❌ Missing');
  console.log('- Supabase URL:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing');
  console.log('- Server running on port 3000:', 'Check manually');
  console.log('\n');
  
  try {
    // Run tests in sequence
    await testTimestampExtraction();
    await testAITimestampGeneration();
    
    if (process.env.YOUTUBE_API_KEY) {
      await testYouTubeSearch();
      await testChannelPrioritization();
    } else {
      console.log('⚠️  Skipping YouTube API tests (no API key)\n');
    }
    
    // Only test chat integration if server is running
    try {
      await axios.get('http://localhost:3000/health');
      await testChatIntegration();
    } catch {
      console.log('⚠️  Skipping chat integration tests (server not running)\n');
    }
    
    if (process.env.SUPABASE_URL) {
      await testSupabaseCaching();
    } else {
      console.log('⚠️  Skipping Supabase caching tests (not configured)\n');
    }
    
    console.log('✅ All tests completed!\n');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  }
}

// Run tests if called directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testTimestampExtraction,
  testYouTubeSearch,
  testChannelPrioritization,
  testAITimestampGeneration,
  testChatIntegration,
  testSupabaseCaching
};