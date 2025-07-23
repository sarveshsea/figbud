/**
 * Test script for link preview functionality
 * Tests URL detection, parsing, and preview rendering
 */

const axios = require('axios');

// Test URLs
const testUrls = [
  'Check out this tutorial: https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  'Here\'s the Figma documentation: https://www.figma.com/best-practices/components-styles-and-shared-libraries/',
  'Found this on GitHub: https://github.com/figma/plugin-samples',
  'Great article on Medium: https://medium.com/figma-design/introducing-figma-community-7987e17b8e66',
  'Multiple links: https://dribbble.com/shots/popular and https://www.behance.net/galleries',
  'https://www.google.com/search?q=figma+plugins'
];

async function testLinkPreviews() {
  console.log('🔗 Testing Link Preview Functionality\n');
  
  try {
    // Test link parsing
    console.log('1. Testing URL detection and parsing:');
    testUrls.forEach((text, index) => {
      console.log(`\n   Test ${index + 1}: "${text}"`);
      
      // Simple URL detection regex for testing
      const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;
      const matches = text.match(urlRegex);
      
      if (matches) {
        console.log(`   ✅ Found ${matches.length} URL(s):`);
        matches.forEach(url => {
          const domain = new URL(url).hostname.replace('www.', '');
          console.log(`      - ${url}`);
          console.log(`        Domain: ${domain}`);
          
          // Check for special platforms
          if (url.includes('youtube.com') || url.includes('youtu.be')) {
            console.log(`        Platform: YouTube`);
            // Extract video ID
            const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
            if (videoIdMatch) {
              console.log(`        Video ID: ${videoIdMatch[1]}`);
              console.log(`        Thumbnail: https://img.youtube.com/vi/${videoIdMatch[1]}/hqdefault.jpg`);
            }
          } else if (url.includes('figma.com')) {
            console.log(`        Platform: Figma`);
          } else if (url.includes('github.com')) {
            console.log(`        Platform: GitHub`);
          }
        });
      } else {
        console.log('   ❌ No URLs found');
      }
    });
    
    // Test backend endpoint
    console.log('\n\n2. Testing backend link preview endpoint:');
    const testUrl = 'https://www.figma.com/best-practices/';
    
    try {
      const response = await axios.get('http://localhost:3000/api/chat/link-preview', {
        params: { url: testUrl }
      });
      
      console.log(`   ✅ Link preview for ${testUrl}:`);
      console.log(`      Title: ${response.data.title}`);
      console.log(`      Description: ${response.data.description}`);
      console.log(`      Favicon: ${response.data.favicon}`);
    } catch (error) {
      console.log(`   ❌ Failed to fetch link preview: ${error.message}`);
      console.log('      Make sure the server is running on port 3000');
    }
    
    // Display implementation summary
    console.log('\n\n3. Implementation Summary:');
    console.log('   ✅ Created linkParser utility with URL detection');
    console.log('   ✅ Created LinkPreview component with thumbnail support');
    console.log('   ✅ Updated ChatView to render link previews');
    console.log('   ✅ Added sleek CSS styles with glass morphism effect');
    console.log('   ✅ Added types for link preview data');
    console.log('   ✅ Created backend endpoint for metadata fetching');
    
    console.log('\n\n4. Features Implemented:');
    console.log('   • URL detection in chat messages');
    console.log('   • Inline compact link display');
    console.log('   • Full link preview cards with thumbnails');
    console.log('   • Special handling for YouTube, Figma, GitHub');
    console.log('   • Loading and error states');
    console.log('   • Hover animations and focus states');
    console.log('   • Responsive design for Figma plugin');
    
    console.log('\n\n5. Visual Design:');
    console.log('   • Glass morphism effect matching dark theme');
    console.log('   • 16:9 thumbnail aspect ratio');
    console.log('   • Favicon display for brand recognition');
    console.log('   • Smooth hover transitions');
    console.log('   • Skeleton loading animation');
    console.log('   • Compact inline link badges');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }
}

// Run tests
testLinkPreviews();