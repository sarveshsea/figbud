# FigBud Plugin Fix Strategy

## The Problem
1. Figma plugins load HTML via `__html__` variable
2. Complex React builds with inline scripts cause syntax errors
3. The document.write() method Figma uses can't handle certain JavaScript syntax

## The Solution

### Option 1: Simple Plugin (Recommended for Testing)
I've created a simple plugin in `/simple-plugin/` that:
- Uses plain HTML and vanilla JavaScript
- No React, no webpack, no build process
- Works immediately without any compilation

To test:
1. In Figma: Plugins → Development → Import plugin from manifest
2. Navigate to `figbud/simple-plugin/manifest.json`
3. Test the basic functionality

### Option 2: Fix the Main Plugin
The issue is that webpack + React + inline scripts = too complex for Figma's loader.

Here's how to fix it:

1. **Use webpack's built-in HTML handling**:
   - Remove our custom inline script
   - Use HtmlWebpackPlugin with proper settings
   - Let webpack handle the bundling

2. **Alternative: Use an iframe approach**:
   - Host the UI on a local server
   - Load it via iframe in the plugin
   - This separates the complex React app from Figma's loader

3. **Simplest fix: Pre-built static HTML**:
   - Build the React app to a single HTML file
   - Manually optimize it for Figma
   - Check it into the repo

## Immediate Next Steps

1. Test the simple plugin to verify Figma is working correctly
2. If that works, we can either:
   - Build on the simple plugin (add features incrementally)
   - Fix the React build process
   - Use a different UI framework that's more Figma-friendly

The key lesson: Figma plugins need simple, self-contained HTML files. Complex build processes often break.