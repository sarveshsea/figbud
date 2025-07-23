const axios = require('axios');
require('dotenv').config();

const API_URL = 'http://localhost:3000/api';

// Different widget sessions to simulate multiple users
const sessions = [
  { id: 'widget_session_1', userId: null, name: 'Anonymous User 1' },
  { id: 'widget_session_2', userId: null, name: 'Anonymous User 2' },
  { id: 'widget_session_3', userId: 'user123', name: 'Authenticated User' }
];

async function testChatSessions() {
  console.log('🧪 Testing FigBud Chat Sessions with Supabase\n');
  
  // Test 1: Create multiple sessions and send messages
  console.log('1️⃣ Creating sessions and sending messages...\n');
  
  for (const session of sessions) {
    console.log(`\n📱 Session: ${session.name} (${session.id})`);
    
    try {
      // Send a message from each session
      const response = await axios.post(`${API_URL}/chat/message`, {
        message: `Hello from ${session.name}! Create a button component.`,
        context: { test: true },
        widgetSessionId: session.id
      }, {
        headers: session.userId ? { 'x-user-id': session.userId } : {}
      });
      
      console.log('✅ Message sent successfully');
      console.log('- Session ID:', response.data.sessionId);
      console.log('- Conversation ID:', response.data.conversationId);
      console.log('- Response:', response.data.response.substring(0, 100) + '...');
      
      // Store conversation ID for later
      session.conversationId = response.data.conversationId;
      session.sessionDbId = response.data.sessionId;
      
    } catch (error) {
      console.error('❌ Error:', error.response?.data || error.message);
    }
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 2: Verify session isolation
  console.log('2️⃣ Testing session isolation...\n');
  
  // Try to access conversation from different session
  try {
    console.log('Attempting to access User 1\'s conversation from User 2\'s session...');
    const response = await axios.get(
      `${API_URL}/chat/conversations/${sessions[0].conversationId}/messages`,
      {
        headers: { 'x-widget-session-id': sessions[1].id }
      }
    );
    console.log('⚠️  WARNING: Able to access another user\'s conversation!');
  } catch (error) {
    if (error.response?.status === 403) {
      console.log('✅ Correctly blocked access to another user\'s conversation');
    } else {
      console.error('❌ Unexpected error:', error.response?.data || error.message);
    }
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 3: Send follow-up messages
  console.log('3️⃣ Sending follow-up messages...\n');
  
  const followUpSession = sessions[0];
  try {
    const response = await axios.post(`${API_URL}/chat/message`, {
      message: 'Now create a card component with a shadow',
      context: { test: true },
      widgetSessionId: followUpSession.id
    });
    
    console.log('✅ Follow-up message sent');
    console.log('- Same conversation:', response.data.conversationId === followUpSession.conversationId);
    console.log('- Intent detected:', response.data.metadata?.intent?.action);
    console.log('- Components:', response.data.metadata?.intent?.componentTypes);
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 4: End sessions
  console.log('4️⃣ Ending chat sessions...\n');
  
  for (const session of sessions) {
    try {
      await axios.post(`${API_URL}/chat/session/end`, {
        widgetSessionId: session.id
      });
      console.log(`✅ Ended session for ${session.name}`);
    } catch (error) {
      console.error(`❌ Error ending session for ${session.name}:`, error.response?.data || error.message);
    }
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 5: Verify messages are stored in Supabase
  console.log('5️⃣ Checking if messages are stored in Supabase...\n');
  
  console.log('To verify in Supabase:');
  console.log('1. Go to https://faummrgmlwhfehylhfvx.supabase.co');
  console.log('2. Check the following tables:');
  console.log('   - chat_sessions: Should have 3 sessions');
  console.log('   - chat_conversations: Should have 3 conversations');
  console.log('   - chat_messages: Should have user and assistant messages');
  console.log('   - intent_analysis: Should have parsed intents');
  
  console.log('\n✨ Test complete!');
}

// Run tests
testChatSessions().catch(console.error);