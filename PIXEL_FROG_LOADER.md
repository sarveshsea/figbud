# 🐸 Pixel Frog Loader for FigBud

## Overview
We've created an amazing animated pixel art frog loading indicator that replaces the standard loading spinner with a retro-futuristic experience!

## Features

### 🎮 Pixel Art Frog Character
- **32x32 pixel art design** created entirely with CSS box-shadows
- **Vibrant color palette**: 
  - Frog green (#4CAF50) with dark belly (#388E3C)
  - Neon cyan outline (#00FFFF) for cyberpunk effect
  - Matrix green (#00FF00) for rain effect
  - Neon pink (#FF00FF) accents

### 🦘 Jump Animation System
- **8-frame jump cycle** with squash and stretch
- **Speed increases with progress**:
  - 0-25%: Slow idle bounce (300ms)
  - 25-50%: Small hops (200ms)
  - 50-75%: Higher jumps (150ms)
  - 75-100%: Rapid jumping (100ms)

### ✨ Visual Effects

1. **Matrix Rain**
   - Falling ASCII characters when progress > 50%
   - Green glowing text (#00FF00)
   - Randomized characters and positions

2. **Particle System**
   - Cyan particles spawn on frog landing
   - Physics-based movement with gravity
   - Up to 20 particles at once

3. **Lily Pad Progress**
   - 5 lily pads appear progressively (1 per 20% progress)
   - Glowing effect when active
   - Smooth transitions

4. **Glitch Effect**
   - Activates at 75%+ progress
   - RGB color splits
   - Scanline effects

### 🎨 Retro Styling
- **Pixel Font**: "Press Start 2P" for authentic 8-bit text
- **Pixelated rendering**: CSS image-rendering for crisp pixels
- **Neon glow effects**: Text shadows and box shadows
- **CRT-style effects**: Glitch overlays and scanlines

## Usage

The pixel frog loader is now the default loading animation in FigBud. It's integrated with `LoadingInsights` component:

```tsx
// In ChatWindow.tsx
<LoadingInsights 
  startTime={loadingStartTime}
  currentModel={currentModel}
  usePixelFrog={true} // Default is true
/>
```

### Toggle Between Loaders
To use the standard loader instead:
```tsx
<LoadingInsights 
  startTime={loadingStartTime}
  currentModel={currentModel}
  usePixelFrog={false}
/>
```

## Technical Implementation

### Components
1. **PixelFrogLoader.tsx**: Main component with animation logic
2. **pixel-frog.css**: All styles including pixel art design
3. **LoadingInsights.tsx**: Updated to support pixel frog mode

### Key Technologies
- **React Hooks**: useState, useEffect, useRef for animation
- **CSS Box-Shadow Art**: Creating pixel graphics with shadows
- **requestAnimationFrame**: Smooth particle physics
- **CSS Animations**: Jump states, glow effects, matrix rain

### Performance Optimizations
- Limited particle count (max 20)
- Throttled matrix rain updates
- CSS transforms for smooth animation
- Respects `prefers-reduced-motion`

## Visual States

1. **Idle State (0-3s)**: Simple bounce animation
2. **Analyzing (3-8s)**: Text changes, slight movement
3. **Model Selection (8-15s)**: Process cards appear
4. **Processing (15-25s)**: Higher jumps, lily pads light up
5. **Tutorial Search (25-35s)**: Matrix rain begins
6. **Finalizing (35-45s)**: All effects active
7. **Extended Wait (45s+)**: Glitch effects, reassurance message

## Customization

You can customize the frog by modifying:
- Colors in `pixel-frog.css`
- Animation speeds in `PixelFrogLoader.tsx`
- Particle count and physics
- Matrix rain density
- Jump heights and timing

## Testing

1. Send a message in FigBud chat
2. Watch the pixel frog jump through loading states
3. Notice how animation speed increases with progress
4. See lily pads light up as milestones are reached
5. Enjoy the matrix rain and glitch effects!

## Future Enhancements

- [ ] Sound effects (8-bit jump sounds)
- [ ] Different frog colors/skins
- [ ] Power-ups that affect animation
- [ ] High score for fastest response time
- [ ] Easter eggs for specific commands

The pixel frog loader transforms the waiting experience into an entertaining retro game aesthetic while maintaining the informative loading states users need!