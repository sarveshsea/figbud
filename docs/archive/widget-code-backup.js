// FigBud Widget with Once UI Design System
console.log('[FigBud] Starting widget initialization...');

// Once UI color palette
var colors = {
  background: '#0A0A0A',
  surface: '#1A1A1A',
  border: 'rgba(255, 255, 255, 0.1)',
  primary: '#6366F1',
  primaryHover: '#8B8CF9',
  text: '#E5E5E5',
  textMuted: '#999999',
  success: '#33C651',
  warning: '#F59E0B',
  danger: '#F33C3C',
  info: '#3B82F6'
};

// Main widget component
function FigBudWidget() {
  var showChat = figma.widget.useSyncedState('showChat', false);
  var componentCount = figma.widget.useSyncedState('componentCount', 0);
  
  return figma.widget.AutoLayout({
    name: 'FigBudWidget',
    direction: 'vertical',
    spacing: 0,
    padding: 0,
    width: showChat[0] ? 360 : 320,
    height: showChat[0] ? 480 : 'hug-contents',
    fill: colors.background,
    cornerRadius: 20,
    stroke: colors.border,
    strokeWidth: 1,
    children: [
      // Header
      figma.widget.AutoLayout({
        name: 'Header',
        direction: 'horizontal',
        spacing: 12,
        padding: { horizontal: 20, vertical: 16 },
        width: 'fill-parent',
        fill: colors.surface,
        verticalAlignItems: 'center',
        children: [
          // Logo and title group
          figma.widget.AutoLayout({
            name: 'LogoGroup',
            direction: 'horizontal',
            spacing: 12,
            width: 'fill-parent',
            verticalAlignItems: 'center',
            children: [
              // Logo
              figma.widget.Frame({
                name: 'Logo',
                width: 40,
                height: 40,
                fill: colors.primary,
                cornerRadius: 20,
                children: [
                  figma.widget.Text({
                    text: '🤖',
                    fontSize: 20,
                    horizontalAlignText: 'center',
                    verticalAlignText: 'center',
                    width: 'fill-parent',
                    height: 'fill-parent'
                  })
                ]
              }),
              // Title
              figma.widget.Text({
                text: 'FigBud',
                fontSize: 18,
                fontWeight: 700,
                fill: colors.text
              }),
              // Badge
              figma.widget.AutoLayout({
                name: 'Badge',
                direction: 'horizontal',
                spacing: 4,
                padding: { horizontal: 8, vertical: 4 },
                fill: { r: 59/255, g: 130/255, b: 246/255, a: 0.1 },
                cornerRadius: 12,
                children: [
                  figma.widget.Text({
                    text: '🆓 Free',
                    fontSize: 11,
                    fill: colors.info
                  })
                ]
              })
            ]
          }),
          // Toggle button
          figma.widget.AutoLayout({
            name: 'ToggleButton',
            direction: 'horizontal',
            spacing: 0,
            padding: 8,
            fill: { r: 1, g: 1, b: 1, a: 0.05 },
            cornerRadius: 8,
            onClick: function() {
              showChat[1](!showChat[0]);
            },
            children: [
              figma.widget.Text({
                text: showChat[0] ? '✕' : '💬',
                fontSize: 16,
                fill: colors.text
              })
            ]
          })
        ]
      }),
      
      // Content area
      showChat[0] ? 
        // Expanded view
        figma.widget.AutoLayout({
          name: 'ExpandedContent',
          direction: 'vertical',
          spacing: 16,
          padding: 20,
          width: 'fill-parent',
          height: 'fill-parent',
          children: [
            // Welcome card
            figma.widget.AutoLayout({
              name: 'WelcomeCard',
              direction: 'vertical',
              spacing: 12,
              padding: 20,
              width: 'fill-parent',
              fill: { r: 59/255, g: 130/255, b: 246/255, a: 0.05 },
              stroke: { r: 59/255, g: 130/255, b: 246/255, a: 0.2 },
              strokeWidth: 2,
              strokeDashPattern: [8, 4],
              cornerRadius: 16,
              children: [
                figma.widget.Text({
                  text: '👋 Welcome to FigBud!',
                  fontSize: 20,
                  fontWeight: 700,
                  fill: colors.text
                }),
                figma.widget.Text({
                  text: "I'm your AI assistant for Figma. Click the buttons below to create Once UI components!",
                  fontSize: 14,
                  fill: colors.textMuted,
                  width: 'fill-parent'
                })
              ]
            }),
            
            // Quick actions section
            figma.widget.AutoLayout({
              name: 'QuickActions',
              direction: 'vertical',
              spacing: 12,
              width: 'fill-parent',
              children: [
                figma.widget.Text({
                  text: 'QUICK CREATE',
                  fontSize: 11,
                  fontWeight: 700,
                  fill: colors.textMuted,
                  letterSpacing: { value: 0.8, unit: 'PIXELS' }
                }),
                // Action buttons row
                figma.widget.AutoLayout({
                  name: 'ActionButtons',
                  direction: 'horizontal',
                  spacing: 12,
                  width: 'fill-parent',
                  children: [
                    // Button action
                    figma.widget.AutoLayout({
                      name: 'ButtonAction',
                      direction: 'horizontal',
                      spacing: 0,
                      padding: { horizontal: 16, vertical: 10 },
                      width: 'hug-contents',
                      fill: colors.primary,
                      cornerRadius: 8,
                      onClick: function() {
                        createButtonComponent();
                        componentCount[1](componentCount[0] + 1);
                      },
                      children: [
                        figma.widget.Text({
                          text: 'Button',
                          fontSize: 14,
                          fontWeight: 600,
                          fill: { r: 1, g: 1, b: 1 }
                        })
                      ]
                    }),
                    // Card action
                    figma.widget.AutoLayout({
                      name: 'CardAction',
                      direction: 'horizontal',
                      spacing: 0,
                      padding: { horizontal: 16, vertical: 10 },
                      width: 'hug-contents',
                      fill: colors.primary,
                      cornerRadius: 8,
                      onClick: function() {
                        createCardComponent();
                        componentCount[1](componentCount[0] + 1);
                      },
                      children: [
                        figma.widget.Text({
                          text: 'Card',
                          fontSize: 14,
                          fontWeight: 600,
                          fill: { r: 1, g: 1, b: 1 }
                        })
                      ]
                    }),
                    // Input action
                    figma.widget.AutoLayout({
                      name: 'InputAction',
                      direction: 'horizontal',
                      spacing: 0,
                      padding: { horizontal: 16, vertical: 10 },
                      width: 'hug-contents',
                      fill: colors.primary,
                      cornerRadius: 8,
                      onClick: function() {
                        createInputComponent();
                        componentCount[1](componentCount[0] + 1);
                      },
                      children: [
                        figma.widget.Text({
                          text: 'Input',
                          fontSize: 14,
                          fontWeight: 600,
                          fill: { r: 1, g: 1, b: 1 }
                        })
                      ]
                    })
                  ]
                })
              ]
            }),
            
            // Sandbox button
            figma.widget.AutoLayout({
              name: 'SandboxButton',
              direction: 'horizontal',
              spacing: 0,
              padding: 16,
              width: 'fill-parent',
              fill: { r: 59/255, g: 130/255, b: 246/255, a: 0.03 },
              stroke: { r: 59/255, g: 130/255, b: 246/255, a: 0.2 },
              strokeWidth: 2,
              strokeDashPattern: [8, 4],
              cornerRadius: 16,
              horizontalAlignItems: 'center',
              verticalAlignItems: 'center',
              onClick: function() {
                startSandboxMode();
              },
              children: [
                figma.widget.AutoLayout({
                  name: 'SandboxContent',
                  direction: 'vertical',
                  spacing: 4,
                  horizontalAlignItems: 'center',
                  children: [
                    figma.widget.Text({
                      text: '🎮 Enter Sandbox Mode',
                      fontSize: 16,
                      fontWeight: 600,
                      fill: colors.info
                    }),
                    figma.widget.Text({
                      text: "Practice creating components with step-by-step guidance",
                      fontSize: 12,
                      fill: colors.textMuted
                    })
                  ]
                })
              ]
            }),
            
            // Component counter
            figma.widget.AutoLayout({
              name: 'Counter',
              direction: 'horizontal',
              spacing: 0,
              padding: 12,
              width: 'fill-parent',
              fill: { r: 1, g: 1, b: 1, a: 0.05 },
              cornerRadius: 12,
              horizontalAlignItems: 'center',
              verticalAlignItems: 'center',
              children: [
                figma.widget.Text({
                  text: 'Components Created: ' + componentCount[0],
                  fontSize: 14,
                  fill: colors.text,
                  fontWeight: 600
                })
              ]
            })
          ]
        }) : 
        // Collapsed view
        figma.widget.AutoLayout({
          name: 'CollapsedContent',
          direction: 'vertical',
          spacing: 8,
          padding: 16,
          width: 'fill-parent',
          children: [
            figma.widget.Text({
              text: 'Click 💬 to open FigBud assistant',
              fontSize: 14,
              fill: colors.textMuted,
              horizontalAlignText: 'center'
            }),
            figma.widget.Text({
              text: 'Components created: ' + componentCount[0],
              fontSize: 12,
              fill: colors.textMuted,
              horizontalAlignText: 'center'
            })
          ]
        })
    ]
  });
}

// Create button component
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
  
  // Position near viewport center
  var viewport = figma.viewport.center;
  button.x = viewport.x - 60;
  button.y = viewport.y - 24;
  
  figma.currentPage.appendChild(button);
  figma.currentPage.selection = [button];
  figma.viewport.scrollAndZoomIntoView([button]);
  
  figma.notify('✅ Button created with Once UI style!');
}

// Create card component
function createCardComponent() {
  var card = figma.createFrame();
  card.name = 'Once UI Card';
  card.resize(320, 200);
  card.cornerRadius = 16;
  card.fills = [{type: 'SOLID', color: {r: 0.1, g: 0.1, b: 0.1}}];
  card.strokes = [{type: 'SOLID', color: {r: 0.2, g: 0.2, b: 0.2}}];
  card.strokeWeight = 1;
  card.layoutMode = 'VERTICAL';
  card.padding = 24;
  card.itemSpacing = 16;
  
  // Add title
  var title = figma.createText();
  title.characters = "Card Title";
  title.fontSize = 18;
  title.fontName = {family: "Inter", style: "Bold"};
  title.fills = [{type: 'SOLID', color: {r: 0.9, g: 0.9, b: 0.9}}];
  
  // Add description
  var description = figma.createText();
  description.characters = "This is a card component using Once UI design principles.";
  description.fontSize = 14;
  description.fontName = {family: "Inter", style: "Regular"};
  description.fills = [{type: 'SOLID', color: {r: 0.6, g: 0.6, b: 0.6}}];
  description.layoutAlign = 'STRETCH';
  
  card.appendChild(title);
  card.appendChild(description);
  
  // Position near viewport center
  var viewport = figma.viewport.center;
  card.x = viewport.x - 160;
  card.y = viewport.y - 100;
  
  figma.currentPage.appendChild(card);
  figma.currentPage.selection = [card];
  figma.viewport.scrollAndZoomIntoView([card]);
  
  figma.notify('✅ Card created with Once UI style!');
}

// Create input component
function createInputComponent() {
  var inputContainer = figma.createFrame();
  inputContainer.name = 'Once UI Input';
  inputContainer.layoutMode = 'VERTICAL';
  inputContainer.itemSpacing = 8;
  inputContainer.layoutAlign = 'MIN';
  
  // Label
  var label = figma.createText();
  label.characters = "Email address";
  label.fontSize = 14;
  label.fontName = {family: "Inter", style: "Medium"};
  label.fills = [{type: 'SOLID', color: {r: 0.9, g: 0.9, b: 0.9}}];
  
  // Input field
  var input = figma.createFrame();
  input.resize(320, 48);
  input.cornerRadius = 8;
  input.fills = [{type: 'SOLID', color: {r: 0.15, g: 0.15, b: 0.15}}];
  input.strokes = [{type: 'SOLID', color: {r: 0.2, g: 0.2, b: 0.2}}];
  input.strokeWeight = 1;
  input.layoutMode = 'HORIZONTAL';
  input.paddingLeft = 16;
  input.paddingRight = 16;
  input.primaryAxisAlignItems = 'CENTER';
  
  // Placeholder text
  var placeholder = figma.createText();
  placeholder.characters = "Enter your email";
  placeholder.fontSize = 14;
  placeholder.fontName = {family: "Inter", style: "Regular"};
  placeholder.fills = [{type: 'SOLID', color: {r: 0.6, g: 0.6, b: 0.6}}];
  
  input.appendChild(placeholder);
  inputContainer.appendChild(label);
  inputContainer.appendChild(input);
  
  // Position near viewport center
  var viewport = figma.viewport.center;
  inputContainer.x = viewport.x - 160;
  inputContainer.y = viewport.y - 30;
  
  figma.currentPage.appendChild(inputContainer);
  figma.currentPage.selection = [inputContainer];
  figma.viewport.scrollAndZoomIntoView([inputContainer]);
  
  figma.notify('✅ Input field created with Once UI style!');
}

// Start sandbox mode
function startSandboxMode() {
  // Create sandbox frame with Once UI styling
  var sandboxFrame = figma.createFrame();
  sandboxFrame.name = "FigBud Sandbox - Once UI";
  sandboxFrame.resize(800, 600);
  sandboxFrame.fills = [{type: 'SOLID', color: {r: 0.039, g: 0.039, b: 0.039}}];
  sandboxFrame.cornerRadius = 20;
  sandboxFrame.strokes = [{type: 'SOLID', color: {r: 0.23, g: 0.51, b: 0.96}, opacity: 0.2}];
  sandboxFrame.strokeWeight = 2;
  sandboxFrame.dashPattern = [8, 4];
  
  // Add title
  var title = figma.createText();
  title.x = 30;
  title.y = 30;
  title.characters = "🎮 FigBud Sandbox - Let's Create with Once UI!";
  title.fontSize = 24;
  title.fontName = {family: "Inter", style: "Bold"};
  title.fills = [{type: 'SOLID', color: {r: 0.9, g: 0.9, b: 0.9}}];
  sandboxFrame.appendChild(title);
  
  // Add instructions
  var instructions = figma.createText();
  instructions.x = 30;
  instructions.y = 80;
  instructions.resize(740, 100);
  instructions.characters = "Welcome to the FigBud Sandbox! I'll guide you through creating Once UI components step by step.\n\nUse the widget buttons to:\n• Create Button - Build a perfect Once UI button\n• Create Card - Design beautiful card components\n• Create Input - Master form input design";
  instructions.fontSize = 14;
  instructions.fontName = {family: "Inter", style: "Regular"};
  instructions.fills = [{type: 'SOLID', color: {r: 0.6, g: 0.6, b: 0.6}}];
  instructions.lineHeight = {value: 150, unit: 'PERCENT'};
  sandboxFrame.appendChild(instructions);
  
  // Create practice area
  var practiceArea = figma.createFrame();
  practiceArea.name = "Practice Area";
  practiceArea.x = 30;
  practiceArea.y = 200;
  practiceArea.resize(740, 350);
  practiceArea.fills = [{type: 'SOLID', color: {r: 0.23, g: 0.51, b: 0.96, a: 0.03}}];
  practiceArea.cornerRadius = 12;
  practiceArea.strokeAlign = 'INSIDE';
  practiceArea.strokes = [{type: 'SOLID', color: {r: 0.23, g: 0.51, b: 0.96, a: 0.2}}];
  practiceArea.strokeWeight = 2;
  practiceArea.dashPattern = [8, 4];
  sandboxFrame.appendChild(practiceArea);
  
  // Position near viewport center
  var viewport = figma.viewport.center;
  sandboxFrame.x = viewport.x - 400;
  sandboxFrame.y = viewport.y - 300;
  
  figma.currentPage.appendChild(sandboxFrame);
  figma.viewport.scrollAndZoomIntoView([sandboxFrame]);
  
  // Store sandbox references
  figma.root.setSharedPluginData('figbud', 'sandboxId', sandboxFrame.id);
  figma.root.setSharedPluginData('figbud', 'practiceAreaId', practiceArea.id);
  
  figma.notify('🎮 Sandbox mode activated! Start creating Once UI components!');
}

// Register the widget
console.log('[FigBud] Registering widget...');
figma.widget.register(FigBudWidget);
console.log('[FigBud] Widget registered successfully!');