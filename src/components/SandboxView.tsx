import React, { useState } from 'react';
import {
  Button,
  Card,
  Flex,
  Heading,
  Text,
  Badge,
  Grid,
  SegmentedControl,
  Chip,
  IconButton,
  
} from '@once-ui-system/core';
import styles from './SandboxView.module.css';

interface ComponentStep {
  id: string;
  title: string;
  description: string;
  code: string;
  tips: string[];
  completed: boolean;
}

interface ComponentTemplate {
  id: string;
  name: string;
  icon: string;
  category: 'basic' | 'form' | 'layout' | 'navigation' | 'data';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  description: string;
  steps: ComponentStep[];
}

interface SandboxViewProps {
  onCreateComponent: (template: ComponentTemplate, step: ComponentStep) => void;
  onBack: () => void;
}

export const SandboxView: React.FC<SandboxViewProps> = ({ onCreateComponent, onBack }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<ComponentTemplate | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<string>('instructions');

  const componentTemplates: ComponentTemplate[] = [
    {
      id: 'button',
      name: 'Button Component',
      icon: '🔘',
      category: 'basic',
      difficulty: 'beginner',
      description: 'Create a versatile button with hover states and variants',
      steps: [
        {
          id: 'button-1',
          title: 'Create the base shape',
          description: 'Start by creating a rectangle that will be our button base.',
          code: `// Create a rectangle
const rect = figma.createRectangle();
rect.resize(120, 48);
rect.cornerRadius = 8;
rect.fills = [{ type: 'SOLID', color: { r: 0.388, g: 0.4, b: 0.965 } }];`,
          tips: ['Use Auto Layout for better flexibility', 'Consider using design tokens for colors'],
          completed: false,
        },
        {
          id: 'button-2',
          title: 'Add text label',
          description: 'Add a text layer for the button label.',
          code: `// Create text
const text = figma.createText();
text.characters = "Click me";
text.fontSize = 16;
text.fontName = { family: "Inter", style: "Medium" };
text.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];`,
          tips: ['Center the text using alignment', 'Use semantic naming for layers'],
          completed: false,
        },
        {
          id: 'button-3',
          title: 'Apply Auto Layout',
          description: 'Convert to Auto Layout for responsive behavior.',
          code: `// Convert to Auto Layout
const button = figma.createFrame();
button.layoutMode = 'HORIZONTAL';
button.paddingLeft = 24;
button.paddingRight = 24;
button.paddingTop = 12;
button.paddingBottom = 12;
button.primaryAxisAlignItems = 'CENTER';
button.counterAxisAlignItems = 'CENTER';`,
          tips: ['Use consistent padding values', 'Enable "Hug contents" for dynamic sizing'],
          completed: false,
        },
        {
          id: 'button-4',
          title: 'Create hover state',
          description: 'Add an interactive hover state variant.',
          code: `// Create hover variant
const hoverButton = button.clone();
hoverButton.name = "Button / Hover";
hoverButton.fills = [{ type: 'SOLID', color: { r: 0.31, g: 0.32, b: 0.77 } }];`,
          tips: ['Use interactive components for prototyping', 'Consider adding transition effects'],
          completed: false,
        },
        {
          id: 'button-5',
          title: 'Create component',
          description: 'Convert to a reusable component with variants.',
          code: `// Create component set
const component = figma.createComponentSet();
component.name = "Button";
component.appendChild(button);
component.appendChild(hoverButton);`,
          tips: ['Add properties for different sizes', 'Document component usage'],
          completed: false,
        },
      ],
    },
    {
      id: 'card',
      name: 'Card Component',
      icon: '🃏',
      category: 'layout',
      difficulty: 'beginner',
      description: 'Design a content card with image, text, and actions',
      steps: [
        {
          id: 'card-1',
          title: 'Create card container',
          description: 'Start with a frame that will contain all card elements.',
          code: `// Create card frame
const card = figma.createFrame();
card.resize(320, 400);
card.cornerRadius = 16;
card.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
// Note: Effects are not supported in Figma widgets
// card.effects = [...];`,
          tips: ['Use consistent border radius', 'Apply subtle shadows for depth'],
          completed: false,
        },
        {
          id: 'card-2',
          title: 'Add image placeholder',
          description: 'Create an image area at the top of the card.',
          code: `// Create image placeholder
const image = figma.createRectangle();
image.resize(320, 200);
image.fills = [{ type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }];
image.topLeftRadius = 16;
image.topRightRadius = 16;`,
          tips: ['Use aspect ratio constraints', 'Consider lazy loading for images'],
          completed: false,
        },
        {
          id: 'card-3',
          title: 'Add content area',
          description: 'Create the content section with title and description.',
          code: `// Create content frame
const content = figma.createFrame();
content.layoutMode = 'VERTICAL';
content.layoutAlign = 'STRETCH';
content.padding = 24;
content.itemSpacing = 12;`,
          tips: ['Use Auto Layout for flexible content', 'Maintain consistent spacing'],
          completed: false,
        },
        {
          id: 'card-4',
          title: 'Add interactive elements',
          description: 'Include buttons or links for user actions.',
          code: `// Add action button
const actionButton = figma.createFrame();
actionButton.layoutMode = 'HORIZONTAL';
actionButton.paddingLeft = 16;
actionButton.paddingRight = 16;
actionButton.paddingTop = 8;
actionButton.paddingBottom = 8;
actionButton.cornerRadius = 20;
actionButton.fills = [{ type: 'SOLID', color: { r: 0.388, g: 0.4, b: 0.965 } }];`,
          tips: ['Make actions clearly visible', 'Use consistent button styles'],
          completed: false,
        },
        {
          id: 'card-5',
          title: 'Finalize component',
          description: 'Polish the design and create component.',
          code: `// Create component
const cardComponent = figma.createComponent();
cardComponent.name = "Card";
card.layoutMode = 'VERTICAL';
card.layoutAlign = 'STRETCH';`,
          tips: ['Test with different content lengths', 'Create variants for different states'],
          completed: false,
        },
      ],
    },
    {
      id: 'input',
      name: 'Input Field',
      icon: '📝',
      category: 'form',
      difficulty: 'intermediate',
      description: 'Build an accessible input field with labels and states',
      steps: [
        {
          id: 'input-1',
          title: 'Create input container',
          description: 'Start with a frame for the entire input component.',
          code: `// Create input container
const inputContainer = figma.createFrame();
inputContainer.layoutMode = 'VERTICAL';
inputContainer.itemSpacing = 8;
inputContainer.layoutAlign = 'STRETCH';`,
          tips: ['Plan for label, input, and helper text', 'Use Auto Layout for flexibility'],
          completed: false,
        },
        {
          id: 'input-2',
          title: 'Add label',
          description: 'Create a label for accessibility.',
          code: `// Create label
const label = figma.createText();
label.characters = "Email address";
label.fontSize = 14;
label.fontName = { family: "Inter", style: "Medium" };
label.fills = [{ type: 'SOLID', color: { r: 0.2, g: 0.2, b: 0.2 } }];`,
          tips: ['Use semantic HTML in production', 'Keep labels concise'],
          completed: false,
        },
        {
          id: 'input-3',
          title: 'Create input field',
          description: 'Build the actual input area.',
          code: `// Create input field
const inputField = figma.createFrame();
inputField.resize(320, 48);
inputField.cornerRadius = 8;
inputField.strokeWeight = 1;
inputField.strokes = [{ type: 'SOLID', color: { r: 0.8, g: 0.8, b: 0.8 } }];
inputField.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
inputField.paddingLeft = 16;
inputField.paddingRight = 16;`,
          tips: ['Include placeholder text', 'Consider icon support'],
          completed: false,
        },
        {
          id: 'input-4',
          title: 'Add states',
          description: 'Create focus, error, and disabled states.',
          code: `// Create focus state
const focusInput = inputField.clone();
focusInput.strokes = [{ type: 'SOLID', color: { r: 0.388, g: 0.4, b: 0.965 } }];
focusInput.strokeWeight = 2;

// Create error state
const errorInput = inputField.clone();
errorInput.strokes = [{ type: 'SOLID', color: { r: 0.95, g: 0.2, b: 0.2 } }];`,
          tips: ['Use consistent state colors', 'Add helper text for errors'],
          completed: false,
        },
        {
          id: 'input-5',
          title: 'Create component set',
          description: 'Organize all states into a component.',
          code: `// Create component set
const inputComponent = figma.createComponentSet();
inputComponent.name = "Input Field";
// Add all variants
inputComponent.appendChild(inputContainer);`,
          tips: ['Use boolean properties for states', 'Test with screen readers'],
          completed: false,
        },
      ],
    },
  ];

  const categories = [
    { value: 'all', label: 'All Components' },
    { value: 'basic', label: 'Basic' },
    { value: 'form', label: 'Form' },
    { value: 'layout', label: 'Layout' },
    { value: 'navigation', label: 'Navigation' },
    { value: 'data', label: 'Data Display' },
  ];

  const filteredTemplates = selectedCategory === 'all' 
    ? componentTemplates 
    : componentTemplates.filter(t => t.category === selectedCategory);

  const handleStepComplete = () => {
    if (!selectedTemplate) return;
    
    const currentStep = selectedTemplate.steps[currentStepIndex];
    if (!currentStep) return;
    
    setCompletedSteps(prev => new Set(prev).add(currentStep.id));
    
    // Send message to Figma widget to execute the code
    onCreateComponent(selectedTemplate, currentStep);
    
    // Move to next step if available
    if (currentStepIndex < selectedTemplate.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const progress = selectedTemplate 
    ? (completedSteps.size / selectedTemplate.steps.length) * 100 
    : 0;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'success';
      case 'intermediate': return 'warning';
      case 'advanced': return 'danger';
      default: return 'neutral';
    }
  };

  return (
    <Flex direction="column" fillHeight style={{ height: '100vh', background: '#0A0A0A' }}>
      {/* Header */}
      <Card 
        padding="m" 
         
        style={{ 
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(255, 255, 255, 0.02)'
        }}
      >
        <Flex horizontal="space-between" vertical="center">
          <Flex vertical="center" gap="m">
            <IconButton
              onClick={onBack}
              variant="tertiary"
              size="m"
              tooltip="Back to chat"
            >
              ← Back
            </IconButton>
            <Heading variant="heading-strong-l">Component Sandbox</Heading>
          </Flex>
          
          {selectedTemplate && (
            <Badge color="info">
              {Math.round(progress)}% Complete
            </Badge>
          )}
        </Flex>
      </Card>

      {!selectedTemplate ? (
        <Flex direction="column" fillHeight style={{ padding: '2rem', gap: '1.5rem', overflow: 'auto' }}>
          {/* Template Selection */}
          <SegmentedControl
            selected={selectedCategory}
            onToggle={(value: string) => setSelectedCategory(value)}
            buttons={categories}
          />

          <Grid columns={3} gap="m">
            {filteredTemplates.map((template) => (
              <Card
                key={template.id}
                padding="l"
                radius="l"
                style={{
                  cursor: 'pointer',
                  background: 'rgba(59, 130, 246, 0.05)',
                  border: '2px dashed rgba(59, 130, 246, 0.3)',
                  transition: 'all 0.2s ease',
                }}
                className="sandbox-template-card"
                onClick={() => setSelectedTemplate(template)}
              >
                <Flex direction="column" vertical="center" gap="m">
                  <Text variant="display-strong-l">{template.icon}</Text>
                  <Heading variant="heading-strong-m">{template.name}</Heading>
                  <Badge 
                    color={getDifficultyColor(template.difficulty) as any}
                  >
                    {template.difficulty}
                  </Badge>
                  <Text 
                    variant="body-default-s" 
                    onBackground="neutral-weak" 
                    align="center"
                  >
                    {template.description}
                  </Text>
                  <Text variant="body-default-xs" onBackground="neutral-weak">
                    {template.steps.length} steps
                  </Text>
                </Flex>
              </Card>
            ))}
          </Grid>
        </Flex>
      ) : (
        <Flex direction="column" fillHeight style={{ flex: 1 }}>
          {/* Progress Bar */}
          <div style={{ padding: '0 2rem', marginTop: '1rem' }}>
            <div style={{ width: "100%", height: "4px", background: "rgba(255,255,255,0.1)", borderRadius: "2px", overflow: "hidden" }}><div style={{ width: `${progress}%`, height: "100%", background: "linear-gradient(90deg, #6366F1, #8B5CF6)", transition: "width 0.3s ease" }} /></div>
          </div>
          
          {/* Main Sandbox Area */}
          <Card
            padding="xl"
            radius="xl"
            style={{
              margin: '2rem',
              flex: 1,
              background: 'rgba(59, 130, 246, 0.03)',
              border: '2px dashed rgba(59, 130, 246, 0.2)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Tabs */}
            <SegmentedControl
              selected={activeTab}
              onToggle={(value: string) => setActiveTab(value)}
              buttons={[
                { value: 'instructions', label: 'Instructions' },
                { value: 'code', label: 'Code' },
                { value: 'tips', label: 'Pro Tips' },
              ]}
            />
            
            {/* Tab Content */}
            <Flex 
              direction="column" 
              style={{ 
                marginTop: '2rem',
                height: 'calc(100% - 200px)',
                overflow: 'auto'
              }}
            >
              {activeTab === 'instructions' && (
                <Flex direction="column" gap="l">
                  <Heading variant="heading-strong-l">
                    Step {currentStepIndex + 1}: {selectedTemplate.steps[currentStepIndex]?.title}
                  </Heading>
                  <Text variant="body-default-l" onBackground="neutral-weak">
                    {selectedTemplate.steps[currentStepIndex]?.description}
                  </Text>
                  
                  <Flex gap="m" style={{ marginTop: '2rem' }}>
                    <Button
                      variant="primary"
                      size="l"
                      onClick={handleStepComplete}
                      disabled={completedSteps.has(selectedTemplate.steps[currentStepIndex]?.id || '')}
                    >
                      {completedSteps.has(selectedTemplate.steps[currentStepIndex]?.id || '') 
                        ? 'Completed ✓' 
                        : 'Apply This Step'}
                    </Button>
                    
                    {currentStepIndex > 0 && (
                      <Button
                        variant="secondary"
                        size="l"
                        onClick={() => setCurrentStepIndex(currentStepIndex - 1)}
                      >
                        Previous Step
                      </Button>
                    )}
                    
                    {currentStepIndex < selectedTemplate.steps.length - 1 && (
                      <Button
                        variant="secondary"
                        size="l"
                        onClick={() => setCurrentStepIndex(currentStepIndex + 1)}
                        disabled={!completedSteps.has(selectedTemplate.steps[currentStepIndex]?.id || '')}
                      >
                        Next Step
                      </Button>
                    )}
                  </Flex>
                </Flex>
              )}
              
              {activeTab === 'code' && (
                <Card 
                  padding="l" 
                  radius="m"
                  style={{ 
                    background: 'rgba(0, 0, 0, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <pre style={{ 
                    margin: 0,
                    fontFamily: 'Fira Code, Consolas, monospace',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    color: '#E5E5E5',
                    whiteSpace: 'pre-wrap'
                  }}>
                    <code>{selectedTemplate.steps[currentStepIndex]?.code}</code>
                  </pre>
                </Card>
              )}
              
              {activeTab === 'tips' && (
                <Flex direction="column" gap="m">
                  {selectedTemplate.steps[currentStepIndex]?.tips.map((tip, index) => (
                    <Card 
                      key={index}
                      padding="m" 
                      radius="m"
                      style={{ 
                        background: 'rgba(245, 158, 11, 0.1)',
                        border: '1px solid rgba(245, 158, 11, 0.2)'
                      }}
                    >
                      <Flex gap="s" vertical="start">
                        <Text>💡</Text>
                        <Text variant="body-default-m">{tip}</Text>
                      </Flex>
                    </Card>
                  ))}
                </Flex>
              )}
            </Flex>

            {/* Step Progress */}
            <Flex 
              horizontal="center" 
              gap="s" 
              style={{ 
                position: 'absolute',
                bottom: '2rem',
                left: '50%',
                transform: 'translateX(-50%)'
              }}
            >
              {selectedTemplate.steps.map((step, index) => (
                <Button
                  key={step.id}
                  variant={
                    completedSteps.has(step.id) 
                      ? 'primary' 
                      : index === currentStepIndex 
                      ? 'secondary' 
                      : 'tertiary'
                  }
                  size="s"
                  onClick={() => setCurrentStepIndex(index)}
                  style={{ 
                    width: '40px', 
                    height: '40px', 
                    borderRadius: '50%',
                    padding: 0 
                  }}
                >
                  {index + 1}
                </Button>
              ))}
            </Flex>
          </Card>

          <Flex horizontal="center" style={{ padding: '1rem' }}>
            <Button
              variant="tertiary"
              onClick={() => {
                setSelectedTemplate(null);
                setCurrentStepIndex(0);
                setCompletedSteps(new Set());
              }}
            >
              Choose Different Component
            </Button>
          </Flex>
        </Flex>
      )}
    </Flex>
  );
};