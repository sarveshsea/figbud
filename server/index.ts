import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import chatRoutes from './routes/chat';
import chatStreamRoutes from './routes/chat-stream';

config();

// Validate environment variables
function validateEnvironment() {
  const required: string[] = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_KEY',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET'
  ];
  
  const optional: string[] = [
    'OPENROUTER_API_KEY',
    'DEEPSEEK_API_KEY',
    'YOUTUBE_API_KEY',
    'FIRECRAWL_API_KEY',
    'ASSEMBLYAI_API_KEY',
    'FIGMA_API_KEY',
    'GITHUB_TOKEN'
  ];
  
  const missing: string[] = [];
  const warnings: string[] = [];
  
  // Check required variables
  for (const varName of required) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }
  
  // Check optional variables
  for (const varName of optional) {
    if (!process.env[varName]) {
      warnings.push(varName);
    }
  }
  
  // Validate Supabase URL format
  if (process.env.SUPABASE_URL && !process.env.SUPABASE_URL.startsWith('https://')) {
    console.error('❌ SUPABASE_URL must start with https://');
    process.exit(1);
  }
  
  // If any required variables are missing, exit
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\n📄 Please check .env.example for configuration details');
    process.exit(1);
  }
  
  // Show warnings for optional variables
  if (warnings.length > 0) {
    console.warn('⚠️  Missing optional environment variables:');
    warnings.forEach(varName => {
      console.warn(`   - ${varName}`);
    });
    console.warn('   Some features may be limited. Users can provide their own API keys.\n');
  }
  
  console.log('✅ Environment variables validated');
}

// Validate environment before starting
validateEnvironment();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware - Allow all origins for Figma plugin
app.use(cors({
  origin: true, // Allow all origins including file:// and Figma's internal URLs
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization',
    'X-OpenRouter-Key',
    'X-DeepSeek-Key',
    'X-YouTube-Key',
    'X-Firecrawl-Key'
  ]
}));
app.use(express.json());

// Routes
app.use('/api/chat', chatRoutes);
app.use('/api/chat', chatStreamRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Cache statistics endpoint
app.get('/api/cache/stats', (req, res) => {
  const { aiResponseCache, tutorialCache } = require('./services/memory-cache');
  
  res.json({
    aiResponses: aiResponseCache.getStats(),
    tutorials: tutorialCache.getStats(),
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 FigBud server running on port ${PORT}`);
});