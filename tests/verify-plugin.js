#!/usr/bin/env node

/**
 * FigBud Plugin Verification Script
 * Ensures the plugin is properly structured and ready to run
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying FigBud Plugin Structure...\n');

let errors = 0;
let warnings = 0;

// Check required files
const requiredFiles = [
  { file: 'manifest.json', type: 'critical' },
  { file: 'code.js', type: 'critical' },
  { file: 'ui.html', type: 'critical' }
];

const optionalFiles = [
  { file: 'PLUGIN_README.md', type: 'optional' },
  { file: 'PLUGIN_TESTING_GUIDE.md', type: 'optional' },
  { file: 'supabase-schema.sql', type: 'optional' }
];

// Check required files
console.log('📁 Checking required files:');
requiredFiles.forEach(({ file, type }) => {
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - MISSING!`);
    errors++;
  }
});

console.log('\n📁 Checking optional files:');
optionalFiles.forEach(({ file }) => {
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ⚠️  ${file} - Not found (optional)`);
    warnings++;
  }
});

// Validate manifest.json
console.log('\n📋 Validating manifest.json:');
if (fs.existsSync('manifest.json')) {
  try {
    const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
    
    // Check required fields
    const requiredFields = ['name', 'id', 'api', 'main', 'editorType'];
    requiredFields.forEach(field => {
      if (manifest[field]) {
        console.log(`  ✅ ${field}: ${JSON.stringify(manifest[field])}`);
      } else {
        console.log(`  ❌ ${field}: MISSING!`);
        errors++;
      }
    });
    
    // Check if main file exists
    if (manifest.main && !fs.existsSync(manifest.main)) {
      console.log(`  ❌ Main file '${manifest.main}' not found!`);
      errors++;
    }
    
    // Check if UI file exists
    if (manifest.ui && !fs.existsSync(manifest.ui)) {
      console.log(`  ❌ UI file '${manifest.ui}' not found!`);
      errors++;
    }
    
    // Validate ID format
    if (manifest.id && !/^\d+$/.test(manifest.id)) {
      console.log(`  ⚠️  ID should be numeric, got: ${manifest.id}`);
      warnings++;
    }
    
  } catch (error) {
    console.log(`  ❌ Invalid JSON: ${error.message}`);
    errors++;
  }
}

// Check code.js
console.log('\n📝 Checking code.js:');
if (fs.existsSync('code.js')) {
  const code = fs.readFileSync('code.js', 'utf8');
  
  // Check for required patterns
  const patterns = [
    { pattern: /figma\.on\(['"]run['"]/, desc: 'Plugin entry point' },
    { pattern: /figma\.showUI/, desc: 'UI display' },
    { pattern: /figma\.ui\.onmessage/, desc: 'Message handler' },
    { pattern: /try\s*\{/, desc: 'Error handling' }
  ];
  
  patterns.forEach(({ pattern, desc }) => {
    if (pattern.test(code)) {
      console.log(`  ✅ ${desc}`);
    } else {
      console.log(`  ⚠️  ${desc} - Not found`);
      warnings++;
    }
  });
  
  // Check file size
  const stats = fs.statSync('code.js');
  const sizeKB = (stats.size / 1024).toFixed(2);
  console.log(`  📊 File size: ${sizeKB} KB`);
  if (stats.size > 1024 * 1024) {
    console.log(`  ⚠️  File is large (>1MB), may affect performance`);
    warnings++;
  }
}

// Check ui.html
console.log('\n🎨 Checking ui.html:');
if (fs.existsSync('ui.html')) {
  const html = fs.readFileSync('ui.html', 'utf8');
  
  // Check for required elements
  const elements = [
    { pattern: /<script/, desc: 'JavaScript code' },
    { pattern: /parent\.postMessage/, desc: 'Plugin communication' },
    { pattern: /window\.onmessage/, desc: 'Message receiver' },
    { pattern: /<style|<link.*css/, desc: 'Styling' }
  ];
  
  elements.forEach(({ pattern, desc }) => {
    if (pattern.test(html)) {
      console.log(`  ✅ ${desc}`);
    } else {
      console.log(`  ⚠️  ${desc} - Not found`);
      warnings++;
    }
  });
}

// Check for problematic files
console.log('\n🚫 Checking for widget files (should be removed):');
const widgetFiles = [
  'figbud-widget.js',
  'widget-manifest.json',
  'manifest-widget.json'
];

widgetFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`  ❌ ${file} - Widget file found! Remove this.`);
    errors++;
  }
});

// Summary
console.log('\n📊 Verification Summary:');
console.log(`  Errors: ${errors}`);
console.log(`  Warnings: ${warnings}`);

if (errors === 0) {
  console.log('\n✅ Plugin structure is valid! Ready to import into Figma.');
  console.log('\nNext steps:');
  console.log('1. Open Figma Desktop');
  console.log('2. Go to Plugins → Development → Import plugin from manifest');
  console.log('3. Select manifest.json from this directory');
  console.log('4. Test using PLUGIN_TESTING_GUIDE.md');
  process.exit(0);
} else {
  console.log('\n❌ Plugin has errors that must be fixed before importing.');
  console.log('Please address the issues above and run this script again.');
  process.exit(1);
}