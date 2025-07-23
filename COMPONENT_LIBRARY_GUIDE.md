# FigBud Component Library Guide

## How to Access the Component Library

1. **Open FigBud Plugin** in Figma
2. **Look for the Grid Icon** in the header (next to the minimize button)
   - It's a 4-square grid icon (⊞)
3. **Click the Grid Icon** to open the Component Library

## What You'll See

### Component Library View
- **Search Bar**: Search for components by name, description, or tags
- **Library Filter**: Filter by Shadcn UI, Once UI, or Custom components
- **Categories Sidebar**: Browse components by category
  - 📚 All Components
  - 🎯 Buttons & Actions
  - 📝 Forms & Inputs
  - 📐 Layout & Structure
  - 📊 Data Display
  - 🧭 Navigation
  - 💬 Feedback & Status
  - 🎨 Templates

### Component Cards
Each component shows:
- Visual preview
- Component name and description
- Library badge (Shadcn/Once UI/Custom)
- Available variants
- Tags for easy discovery

## How to Use Components

1. **Browse or Search** for the component you need
2. **Click on a Component Card** to open the builder
3. **Customize Properties** in the Component Builder:
   - Modify text, colors, sizes
   - Toggle different variants
   - Set custom Tailwind classes (for Shadcn)
4. **Preview Your Changes** in real-time
5. **Click "Create Component"** to add it to your Figma design

## Available Components

### Shadcn UI Components
- **Button**: Multiple variants (default, destructive, outline, secondary, ghost, link)
- **Card**: Flexible container with shadow effects
- **Input**: Text input with label support
- **Badge**: Status indicators with color variants

### Professional Templates
- **Login Form**: Complete authentication UI
- **Pricing Card**: Subscription plan display
- **Feature Section**: Grid layout for features
- **Navigation Bar**: Header with links and CTAs

## Troubleshooting

If you don't see the component library button:
1. Make sure you've built the latest version: `npm run build`
2. Reload the plugin in Figma (Plugins → Development → FigBud → Run)
3. Check the browser console for any errors

## Technical Details

The component library system includes:
- **ShadcnFigmaConverter**: Converts Tailwind classes to Figma properties
- **DesignSystemManager**: Manages all components and categories
- **ComponentDatabase**: Tracks usage and stores custom components
- **Professional Templates**: Pre-built UI patterns

All components are rendered with actual styling, not placeholder rectangles!