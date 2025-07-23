#!/usr/bin/env node

/**
 * Environment Validation Script
 * Checks that all required environment variables are set and valid
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// Load .env file if it exists
require('dotenv').config();

// Configuration
const ENV_FILE = path.join(__dirname, '..', '.env');
const ENV_EXAMPLE_FILE = path.join(__dirname, '..', '.env.example');

// Required environment variables
const REQUIRED_VARS = [
  { name: 'SUPABASE_URL', validate: (val) => val.startsWith('https://'), error: 'Must be a valid HTTPS URL' },
  { name: 'SUPABASE_ANON_KEY', validate: (val) => val.length > 20, error: 'Invalid key format' },
  { name: 'SUPABASE_SERVICE_KEY', validate: (val) => val.length > 20, error: 'Invalid key format' },
  { name: 'JWT_SECRET', validate: (val) => val.length >= 32, error: 'Must be at least 32 characters' },
  { name: 'JWT_REFRESH_SECRET', validate: (val) => val.length >= 32, error: 'Must be at least 32 characters' },
];

// Optional but recommended variables
const OPTIONAL_VARS = [
  { name: 'OPENROUTER_API_KEY', validate: (val) => val.startsWith('sk-or-'), error: 'Should start with sk-or-' },
  { name: 'DEEPSEEK_API_KEY', validate: (val) => val.startsWith('sk-'), error: 'Should start with sk-' },
  { name: 'YOUTUBE_API_KEY', validate: (val) => val.length === 39, error: 'Should be 39 characters' },
  { name: 'OPENAI_API_KEY', validate: (val) => val.startsWith('sk-'), error: 'Should start with sk-' },
  { name: 'ASSEMBLYAI_API_KEY', validate: (val) => val.length === 32, error: 'Should be 32 characters' },
  { name: 'FIGMA_API_KEY', validate: (val) => val.startsWith('figd_'), error: 'Should start with figd_' },
  { name: 'GITHUB_TOKEN', validate: (val) => val.startsWith('ghp_') || val.startsWith('github_pat_'), error: 'Invalid GitHub token format' },
];

// Security checks
const SECURITY_PATTERNS = [
  { pattern: /your-.*-here/i, message: 'Contains placeholder value' },
  { pattern: /change-this/i, message: 'Contains placeholder value' },
  { pattern: /example/i, message: 'Contains example value' },
  { pattern: /test/i, message: 'Contains test value' },
];

console.log(chalk.blue.bold('\n🔍 FigBud Environment Validation\n'));

// Check if .env file exists
if (!fs.existsSync(ENV_FILE)) {
  console.log(chalk.red('❌ .env file not found!'));
  console.log(chalk.yellow(`\n📝 Please create a .env file based on .env.example:`));
  console.log(chalk.gray(`   cp ${ENV_EXAMPLE_FILE} ${ENV_FILE}`));
  console.log(chalk.gray(`   Then fill in your actual values\n`));
  process.exit(1);
}

let hasErrors = false;
let hasWarnings = false;

// Check required variables
console.log(chalk.cyan('Checking required variables...\n'));

for (const varConfig of REQUIRED_VARS) {
  const value = process.env[varConfig.name];
  
  if (!value) {
    console.log(chalk.red(`❌ ${varConfig.name}: Missing`));
    hasErrors = true;
  } else if (!varConfig.validate(value)) {
    console.log(chalk.red(`❌ ${varConfig.name}: ${varConfig.error}`));
    hasErrors = true;
  } else {
    // Check for security issues
    const securityIssue = SECURITY_PATTERNS.find(p => p.pattern.test(value));
    if (securityIssue) {
      console.log(chalk.red(`❌ ${varConfig.name}: ${securityIssue.message}`));
      hasErrors = true;
    } else {
      console.log(chalk.green(`✅ ${varConfig.name}: Valid`));
    }
  }
}

// Check optional variables
console.log(chalk.cyan('\n\nChecking optional variables...\n'));

for (const varConfig of OPTIONAL_VARS) {
  const value = process.env[varConfig.name];
  
  if (!value) {
    console.log(chalk.yellow(`⚠️  ${varConfig.name}: Not set (optional)`));
    hasWarnings = true;
  } else if (!varConfig.validate(value)) {
    console.log(chalk.yellow(`⚠️  ${varConfig.name}: ${varConfig.error}`));
    hasWarnings = true;
  } else {
    // Check for security issues
    const securityIssue = SECURITY_PATTERNS.find(p => p.pattern.test(value));
    if (securityIssue) {
      console.log(chalk.yellow(`⚠️  ${varConfig.name}: ${securityIssue.message}`));
      hasWarnings = true;
    } else {
      console.log(chalk.green(`✅ ${varConfig.name}: Valid`));
    }
  }
}

// Check for exposed keys
console.log(chalk.cyan('\n\nSecurity checks...\n'));

// Check if .env is in .gitignore
const gitignorePath = path.join(__dirname, '..', '.gitignore');
if (fs.existsSync(gitignorePath)) {
  const gitignore = fs.readFileSync(gitignorePath, 'utf8');
  if (gitignore.includes('.env')) {
    console.log(chalk.green('✅ .env is in .gitignore'));
  } else {
    console.log(chalk.red('❌ .env is NOT in .gitignore - credentials may be exposed!'));
    hasErrors = true;
  }
} else {
  console.log(chalk.red('❌ No .gitignore file found!'));
  hasErrors = true;
}

// Check for common security issues
const allVars = [...REQUIRED_VARS, ...OPTIONAL_VARS];
let exposedKeys = 0;

for (const varConfig of allVars) {
  const value = process.env[varConfig.name];
  if (value) {
    // Check if key looks like a real key (not placeholder)
    if (value.includes('your-') || value.includes('example') || value.includes('test')) {
      exposedKeys++;
    }
  }
}

if (exposedKeys === 0) {
  console.log(chalk.green('✅ No obvious placeholder keys detected'));
} else {
  console.log(chalk.yellow(`⚠️  ${exposedKeys} potential placeholder keys detected`));
}

// Summary
console.log(chalk.blue.bold('\n\n📊 Summary\n'));

if (hasErrors) {
  console.log(chalk.red.bold('❌ Environment validation FAILED'));
  console.log(chalk.red('\nPlease fix the errors above before running the application.'));
  console.log(chalk.yellow('\nRefer to SECURITY_URGENT.md for API key rotation instructions.'));
  process.exit(1);
} else if (hasWarnings) {
  console.log(chalk.yellow.bold('⚠️  Environment validation passed with warnings'));
  console.log(chalk.yellow('\nSome optional features may not work without the missing API keys.'));
  console.log(chalk.cyan('\nUsers can provide their own API keys through the plugin settings.'));
} else {
  console.log(chalk.green.bold('✅ Environment validation PASSED'));
  console.log(chalk.green('\nAll environment variables are properly configured!'));
}

// Security reminder
console.log(chalk.magenta.bold('\n\n🔐 Security Reminders:\n'));
console.log(chalk.gray('1. Never commit .env files to version control'));
console.log(chalk.gray('2. Rotate API keys regularly (every 90 days)'));
console.log(chalk.gray('3. Use different keys for development and production'));
console.log(chalk.gray('4. Enable 2FA on all service accounts'));
console.log(chalk.gray('5. Monitor API usage for anomalies\n'));

// Check if running with enhanced provider
if (process.env.DEFAULT_AI_PROVIDER === 'enhanced') {
  console.log(chalk.green('✨ Using Enhanced AI Provider with circuit breakers and retry logic'));
} else {
  console.log(chalk.yellow('💡 Consider using DEFAULT_AI_PROVIDER=enhanced for better reliability'));
}

process.exit(hasErrors ? 1 : 0);