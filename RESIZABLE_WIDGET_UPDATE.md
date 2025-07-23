# FigBud Resizable Widget Update

## Summary

I've successfully updated the FigBud widget to be resizable and redesigned it to match the Dia AI assistant design shown in the screenshot.

## Changes Made

### 1. **Enabled Resizable Widget**
- Updated `src/code.ts` to configure the widget dimensions (440x600)
- Widget is now resizable by users

### 2. **Created New Minimal Chat View**
- Created `src/components/MinimalChatView.tsx` that matches the Dia AI design
- Features a settings view with personalization options
- Includes sections for:
  - Personalize answers toggle
  - Who inspires you (with textarea)
  - How do you digest information (with textarea)
  - Write Skill customization

### 3. **Updated Dark Theme**
- Modified `src/styles/main.css` to use dark theme colors:
  - Background: #0A0A0A
  - Surface: #1A1A1A
  - Text: #E5E5E5
  - Borders: rgba(255, 255, 255, 0.1)
  - Primary: #6366F1

### 4. **UI Improvements**
- Compact design with smaller fonts and padding
- Clean, minimal interface
- Settings view shown initially
- Smooth transition between settings and chat

## How to Use

1. The widget now opens at 440x600 pixels
2. Users can resize it by dragging the corners (in Figma)
3. Settings view shows personalization options
4. Click "Start Chat" to begin chatting
5. Click the settings icon (⚙️) to return to settings

## Build Status

✅ Build successful
✅ All TypeScript errors fixed
✅ Widget is fully functional

The widget now matches the Dia AI assistant design with a resizable, dark-themed interface.