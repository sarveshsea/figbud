import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { join } from 'path';

// Import routes
import authRoutes from './routes/auth';
import chatRoutes from './routes/chat';

// Import database and cache initialization
import { initializeDatabase } from './config/databaseConfig';
import { RedisService } from './services/redis';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.openai.com", "https://www.googleapis.com", "https://api.assemblyai.com"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: [
    'https://figma.com',
    'https://www.figma.com',
    'http://localhost:8080', // For development
    'http://localhost:3001', // For plugin UI development
    'file://', // For local Figma plugin development
    '*' // Allow all origins for development - restrict in production
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, '../dist')));
  
  // Serve widget files
  app.get('/manifest.json', (req, res) => {
    res.sendFile(join(__dirname, '../manifest.json'));
  });
  
  app.get('/code.js', (req, res) => {
    res.sendFile(join(__dirname, '../dist/code.js'));
  });
  
  app.get('/ui.html', (req, res) => {
    res.sendFile(join(__dirname, '../dist/ui.html'));
  });
}

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Initialize database and start server
const startServer = async () => {
  try {
    // Initialize database
    await initializeDatabase();
    
    // Initialize Redis cache
    await RedisService.initialize();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`
🚀 FigBud Server is running!
   
📍 Port: ${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
🕒 Started at: ${new Date().toISOString()}

📚 API Endpoints:
   GET  /health              - Health check
   POST /api/auth/register   - User registration
   POST /api/auth/login      - User login
   POST /api/chat/message    - Process chat messages
   GET  /api/chat/tutorials  - Search tutorials
   POST /api/chat/analyze    - Analyze design
   
🔗 Widget files:
   GET  /manifest.json       - Figma widget manifest
   GET  /code.js            - Widget code
   GET  /ui.html            - Widget UI
   
💾 Database: ${process.env.DATABASE_URL ? 'PostgreSQL' : 'File-based'}
  `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;