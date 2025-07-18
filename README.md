# FigBud - AI-Powered Figma Assistant

FigBud is an AI-powered Figma widget that enhances designer productivity by providing timestamped YouTube tutorial recommendations, automated demo creation, step-by-step guidance, and collaboration tools. Built with TypeScript, React, and Node.js, integrating Figma Widget API, YouTube Data API, and OpenAI API.

## 🌟 Features

### Core Features
- **📚 Timestamped Tutorial Search**: AI-powered YouTube tutorial recommendations with relevant timestamps
- **🎨 Automated Demo Creation**: Generate interactive prototypes from simple prompts
- **🔮 Context-Aware Guidance**: Step-by-step help based on your current design and skill level
- **👥 Collaboration Tools**: Team onboarding, handoff specs, and shared resources

### User Experience
- **🚀 Progressive Onboarding**: Skill assessment and personalized setup
- **⚙️ Smart Personalization**: Adapts to your design style and experience level
- **📊 Usage Analytics**: Track your learning progress and design improvements
- **💎 Freemium Model**: Free tier with premium advanced features

## 🏗️ Architecture

### Frontend (Figma Widget)
- **TypeScript** + **React** for the widget UI
- **Webpack** for bundling and optimization
- **CSS3** with Figma design system compliance
- Figma Widget API integration

### Backend (Express.js)
- **Node.js** + **Express.js** REST API
- **JWT** authentication with refresh tokens
- **File-based database** (easily upgradeable to PostgreSQL)
- **Redis** caching for API responses
- Rate limiting and security middleware

### External Integrations
- **OpenAI API** for AI-powered responses
- **YouTube Data API v3** for tutorial search
- **AssemblyAI** for timestamp extraction
- **Stripe** for premium subscriptions (planned)

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and npm 9+
- **Figma Desktop App** (latest version)
- **Git** for version control

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/sarveshsea/figbud.git
cd figbud
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your API keys and configuration
```

4. **Build the project**
```bash
npm run build
```

5. **Start the development server**
```bash
npm run dev:server
```

6. **In another terminal, start the widget development**
```bash
npm run dev
```

7. **Load the widget in Figma**
   - Open Figma Desktop App
   - Go to Menu > Widgets > Development > Import widget from manifest
   - Select the `manifest.json` file from your project root
   - The widget will appear in your widgets panel

## 📁 Project Structure

```
figbud/
├── src/                    # Frontend widget source
│   ├── components/         # React components
│   ├── hooks/             # Custom React hooks
│   ├── services/          # API services
│   ├── styles/            # CSS styles
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utility functions
│   ├── code.ts            # Main widget code
│   ├── ui.tsx             # React UI entry point
│   └── ui.html            # HTML template
├── server/                # Backend API source
│   ├── config/            # Configuration files
│   ├── controllers/       # Request handlers
│   ├── middleware/        # Express middleware
│   ├── models/            # Data models
│   ├── routes/            # API routes
│   └── index.ts           # Server entry point
├── tests/                 # Test files
├── dist/                  # Built files
├── data/                  # File-based database
├── manifest.json          # Figma widget manifest
├── webpack.config.js      # Webpack configuration
├── tsconfig.json          # TypeScript configuration
└── package.json           # Project dependencies
```

## 🔧 Development

### Available Scripts

```bash
# Frontend Development
npm run dev              # Start Webpack dev server
npm run build            # Production build
npm run build:dev        # Development build
npm run watch            # Watch mode for development

# Backend Development
npm run dev:server       # Start server with hot reload
npm run start:server     # Start production server
npm run build:server     # Build server for production

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run format           # Format with Prettier
npm run type-check       # TypeScript type checking

# Testing
npm run test             # Run Jest tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage
```

### Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration (for future PostgreSQL migration)
DATABASE_URL=postgresql://username:password@localhost:5432/figbud
REDIS_URL=redis://localhost:6379

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key-change-this-too
JWT_EXPIRE=1h
JWT_REFRESH_EXPIRE=7d

# API Keys (get these from respective providers)
OPENAI_API_KEY=your-openai-api-key
YOUTUBE_API_KEY=your-youtube-data-api-key
ASSEMBLYAI_API_KEY=your-assemblyai-api-key

# Stripe Configuration (for premium features)
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret

# Monitoring
SENTRY_DSN=your-sentry-dsn

# CORS
FRONTEND_URL=https://figma.com
```

### Getting API Keys

1. **OpenAI API Key**
   - Visit [OpenAI Platform](https://platform.openai.com)
   - Create an account and generate an API key
   - Add billing information for usage

2. **YouTube Data API Key**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select existing
   - Enable YouTube Data API v3
   - Create credentials (API Key)

3. **AssemblyAI API Key**
   - Sign up at [AssemblyAI](https://www.assemblyai.com)
   - Get your API key from the dashboard

## 🧪 Testing

### Running Tests
```bash
npm run test              # Run all tests
npm run test:watch        # Run tests in watch mode
npm run test:coverage     # Run with coverage report
```

### Test Structure
- **Unit Tests**: `/tests/unit/` - Test individual functions and components
- **Integration Tests**: `/tests/integration/` - Test API endpoints and workflows
- **E2E Tests**: `/tests/e2e/` - Test complete user workflows (planned)

## 📦 Deployment

### Production Build
```bash
npm run build            # Build frontend
npm run build:server     # Build backend
npm run start:server     # Start production server
```

### Figma Community Release
1. Ensure all tests pass: `npm run test`
2. Build for production: `npm run build`
3. Test the widget thoroughly in Figma
4. Submit to Figma Community via Figma desktop app

### Backend Deployment (AWS/Heroku/Vercel)
1. Set environment variables on your hosting platform
2. Configure build commands:
   - Build: `npm run build:server`
   - Start: `npm run start:server`
3. Set up PostgreSQL database (optional migration from file-based)
4. Configure Redis for caching

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm run test`
5. Run linting: `npm run lint:fix`
6. Commit changes: `git commit -m 'Add amazing feature'`
7. Push to branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

### Code Style
- Use TypeScript for all new code
- Follow ESLint configuration
- Use Prettier for formatting
- Write tests for new features
- Update documentation as needed

### Commit Message Convention
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test additions or modifications
- `chore:` Build process or auxiliary tool changes

## 📊 Performance & Monitoring

### Performance Goals
- Widget load time: <1.5s
- API response time: <4s
- 99.9% uptime
- <0.5% error rate

### Monitoring
- **Sentry** for error tracking
- **Custom analytics** for user behavior
- **Performance monitoring** built-in

## 🔒 Security

### Implemented Security Measures
- JWT authentication with refresh tokens
- Rate limiting on API endpoints
- CORS configuration for Figma domains
- Helmet.js security headers
- Input validation and sanitization
- Environment variable protection

### Security Best Practices
- Never commit API keys or secrets
- Use HTTPS in production
- Regular dependency updates
- Security audits with `npm audit`

## 📈 Roadmap

### Phase 1: Core Features (Current)
- ✅ Basic widget structure
- ✅ Authentication system
- ✅ Tutorial search
- ✅ Demo creation
- ✅ User onboarding

### Phase 2: Enhanced AI (Q1 2025)
- 🔄 Advanced OpenAI integration
- 🔄 Real YouTube API integration
- 🔄 Timestamp extraction
- 🔄 Smart recommendations

### Phase 3: Collaboration (Q2 2025)
- 📋 Team workspaces
- 📋 Advanced handoff tools
- 📋 Design system integration
- 📋 Comment and review system

### Phase 4: Premium Features (Q3 2025)
- 📋 Stripe payment integration
- 📋 Advanced analytics
- 📋 Custom templates
- 📋 API access

## 🐛 Troubleshooting

### Common Issues

**Widget not loading in Figma**
- Ensure Figma Desktop App is updated
- Check that manifest.json is valid
- Verify build completed successfully: `npm run build`

**Backend API errors**
- Check environment variables are set
- Ensure server is running: `npm run dev:server`
- Check console for error messages

**Build failures**
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check TypeScript errors: `npm run type-check`
- Verify all dependencies are installed

**Authentication issues**
- Check JWT secret is set in environment
- Verify tokens are not expired
- Clear browser localStorage and re-authenticate

### Getting Help
- Check the [Issues](https://github.com/sarveshsea/figbud/issues) page
- Read the [Documentation](docs/)
- Contact support: support@figbud.com

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Figma** for the amazing Widget API
- **OpenAI** for powerful AI capabilities
- **YouTube** for educational content access
- **The design community** for inspiration and feedback

---

<div align="center">
  <p>Built with ❤️ for the design community</p>
  <p>
    <a href="https://figbud.com">Website</a> •
    <a href="https://github.com/sarveshsea/figbud/issues">Report Bug</a> •
    <a href="https://github.com/sarveshsea/figbud/issues">Request Feature</a>
  </p>
</div>
