# FigBud with Once UI - Implementation Guide

This document details the Once UI implementation in FigBud, covering all the changes made to integrate the design system.

## 🎨 Once UI Integration Overview

### Design System Implementation
- **Color Palette**: Dark theme with Once UI colors
  - Background: `#0A0A0A`
  - Surface: `#1A1A1A`
  - Primary: `#6366F1`
  - Text: `#E5E5E5`
  - Muted: `#999999`

### Components Used
```typescript
import {
  Button,
  Card,
  Flex,
  Grid,
  Heading,
  Text,
  Badge,
  Input,
  Chip,
  IconButton,
  SegmentedControl,
  Spinner
} from '@once-ui-system/core';
```

## 📁 Updated Files

### 1. **AuthView.tsx**
- Replaced HTML elements with Once UI components
- Fixed prop compatibility issues
- Key changes:
  ```typescript
  // Old
  <div className="auth-card">
  
  // New
  <Card padding="l" radius="l" style={{...}}>
  ```

### 2. **ChatView.tsx**
- Complete UI overhaul with Once UI
- Fixed Badge component usage (color prop instead of variant)
- Implemented proper Flex layouts
- Added Spinner component for loading states

### 3. **SandboxView.tsx**
- Implemented requested design:
  - Curved card with 20px border radius
  - Dashed border (8,4 pattern)
  - Low opacity blueish background
  - Once UI Grid and SegmentedControl

### 4. **Widget Code (code.js)**
- Complete rewrite in ES5 for Figma compatibility
- Once UI styled HTML interface
- Dark theme implementation
- Component creation functions with Once UI styling

## 🗄️ Supabase Database Schema

### Tables Created
1. **users**
   - User profiles and preferences
   - Subscription information
   - Onboarding status

2. **once_ui_components**
   - Component library
   - Figma code snippets
   - Properties and usage examples

3. **api_calls**
   - Usage tracking
   - Performance metrics

4. **api_cache**
   - Response caching
   - Optimization

5. **component_usage**
   - Analytics
   - User patterns

6. **tutorials**
   - Learning content
   - Step-by-step guides

7. **subscriptions**
   - User tiers
   - Feature access

## 🔧 Technical Challenges Solved

### 1. **Once UI Prop Differences**
```typescript
// Issue: Once UI uses different prop names
// Solution:
<Flex horizontal="center" vertical="center"> // Instead of alignItems/justifyContent
```

### 2. **Badge Component**
```typescript
// Issue: No 'variant' prop
// Solution:
<Badge color="brand"> // Instead of variant="primary"
```

### 3. **SegmentedControl**
```typescript
// Issue: Different API
// Solution:
<SegmentedControl
  selected={value}
  onToggle={(val) => setValue(val)}
  buttons={[{value: 'opt1', label: 'Option 1'}]}
/>
```

### 4. **Figma Widget Effects**
```javascript
// Issue: DROP_SHADOW not supported in widgets
// Solution: Removed all effects, used borders and fills instead
```

## 🚀 Setup Instructions

### 1. Install Dependencies
```bash
npm install @once-ui-system/core
npm install @supabase/supabase-js
```

### 2. Setup Supabase
1. Go to Supabase dashboard
2. Run `supabase-setup.sql` in SQL Editor
3. Configure authentication settings
4. Update `.env` with credentials

### 3. Build and Deploy
```bash
npm run build
```

### 4. Load in Figma
- Import widget from manifest
- Widget will show Once UI interface

## 📱 Widget Features

### Quick Create
- **Button**: Creates Once UI styled button
- **Card**: Creates content card with proper styling
- **Input**: Creates form input with label

### Sandbox Mode
- Interactive component creation
- Step-by-step guidance
- Practice area with dashed border
- Blueish background as requested

### Chat Interface
- Natural language commands
- AI-powered responses
- Suggestion chips
- Message history

## 🎯 Design Specifications Met

✅ **Once UI Components**: All views use Once UI
✅ **Supabase Database**: Full schema implemented
✅ **Sandbox Styling**: 
  - Curved card (border-radius: 16px)
  - Dashed border (strokeDashPattern: [8, 4])
  - Low opacity blueish background (rgba(59, 130, 246, 0.05))
✅ **Widget Redesign**: Complete Once UI implementation
✅ **Component Creation**: Actual Figma components with Once UI styling

## 🔍 Code Examples

### Creating a Once UI Button in Figma
```javascript
function createButtonComponent() {
  var button = figma.createFrame();
  button.name = 'Once UI Button';
  button.resize(120, 48);
  button.cornerRadius = 8;
  button.fills = [{type: 'SOLID', color: {r: 0.388, g: 0.4, b: 0.965}}];
  button.layoutMode = 'HORIZONTAL';
  button.paddingLeft = 24;
  button.paddingRight = 24;
  button.paddingTop = 12;
  button.paddingBottom = 12;
  button.primaryAxisAlignItems = 'CENTER';
  button.counterAxisAlignItems = 'CENTER';
  
  var text = figma.createText();
  text.characters = "Click me";
  text.fontSize = 16;
  text.fontName = {family: "Inter", style: "Medium"};
  text.fills = [{type: 'SOLID', color: {r: 1, g: 1, b: 1}}];
  
  button.appendChild(text);
}
```

### Sandbox Area Styling
```javascript
var practiceArea = figma.createFrame();
practiceArea.fills = [{type: 'SOLID', color: {r: 0.23, g: 0.51, b: 0.96, a: 0.03}}];
practiceArea.strokes = [{type: 'SOLID', color: {r: 0.23, g: 0.51, b: 0.96, a: 0.2}}];
practiceArea.strokeWeight = 2;
practiceArea.dashPattern = [8, 4];
```

## 📚 Resources

- [Once UI Documentation](https://once-ui.com/docs)
- [Supabase Documentation](https://supabase.io/docs)
- [Figma Widget API](https://www.figma.com/widget-docs/)

## 🐛 Known Issues & Solutions

1. **Icon Components**: Once UI Icon component didn't work as expected, used emoji fallbacks
2. **ProgressBar**: Component not available in Once UI, created custom implementation
3. **Grid Columns**: Used numeric values instead of "fluid"
4. **Effects in Widgets**: Figma widgets don't support effects, used alternative styling

## 🎉 Result

The FigBud widget now fully implements the Once UI design system with:
- Consistent dark theme
- Proper component styling
- Supabase backend ready
- Interactive sandbox with requested styling
- Functional component creation