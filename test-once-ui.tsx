// Test file to verify Once UI components are working
import React from 'react';
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

export const TestOnceUIComponents: React.FC = () => {
  const [selectedTab, setSelectedTab] = React.useState('tab1');
  
  return (
    <Flex direction="column" gap="l" style={{ padding: '2rem', background: '#0A0A0A', minHeight: '100vh' }}>
      <Heading variant="heading-strong-xl">Once UI Component Test</Heading>
      
      {/* Buttons */}
      <Card padding="l" radius="l">
        <Heading variant="heading-strong-l">Buttons</Heading>
        <Flex gap="m" style={{ marginTop: '1rem' }}>
          <Button variant="primary" size="m">Primary</Button>
          <Button variant="secondary" size="m">Secondary</Button>
          <Button variant="tertiary" size="m">Tertiary</Button>
        </Flex>
      </Card>
      
      {/* Badges */}
      <Card padding="l" radius="l">
        <Heading variant="heading-strong-l">Badges</Heading>
        <Flex gap="m" style={{ marginTop: '1rem' }}>
          <Badge color="neutral">Neutral</Badge>
          <Badge color="brand">Brand</Badge>
          <Badge color="success">Success</Badge>
          <Badge color="warning">Warning</Badge>
          <Badge color="danger">Danger</Badge>
          <Badge color="info">Info</Badge>
        </Flex>
      </Card>
      
      {/* Input */}
      <Card padding="l" radius="l">
        <Heading variant="heading-strong-l">Input</Heading>
        <Input
          id="test-input"
          label="Email Address"
          placeholder="Enter your email"
          style={{ marginTop: '1rem' }}
        />
      </Card>
      
      {/* SegmentedControl */}
      <Card padding="l" radius="l">
        <Heading variant="heading-strong-l">Segmented Control</Heading>
        <SegmentedControl
          selected={selectedTab}
          onToggle={setSelectedTab}
          buttons={[
            { value: 'tab1', label: 'Tab 1' },
            { value: 'tab2', label: 'Tab 2' },
            { value: 'tab3', label: 'Tab 3' }
          ]}
          style={{ marginTop: '1rem' }}
        />
      </Card>
      
      {/* Grid */}
      <Card padding="l" radius="l">
        <Heading variant="heading-strong-l">Grid Layout</Heading>
        <Grid columns={3} gap="m" style={{ marginTop: '1rem' }}>
          <Card padding="m" style={{ background: 'rgba(99, 102, 241, 0.1)' }}>
            <Text>Grid Item 1</Text>
          </Card>
          <Card padding="m" style={{ background: 'rgba(99, 102, 241, 0.1)' }}>
            <Text>Grid Item 2</Text>
          </Card>
          <Card padding="m" style={{ background: 'rgba(99, 102, 241, 0.1)' }}>
            <Text>Grid Item 3</Text>
          </Card>
        </Grid>
      </Card>
      
      {/* Chips */}
      <Card padding="l" radius="l">
        <Heading variant="heading-strong-l">Chips</Heading>
        <Flex gap="s" wrap style={{ marginTop: '1rem' }}>
          <Chip label="Design System" />
          <Chip label="React" />
          <Chip label="TypeScript" />
          <Chip label="Figma" />
        </Flex>
      </Card>
      
      {/* Loading State */}
      <Card padding="l" radius="l">
        <Heading variant="heading-strong-l">Loading State</Heading>
        <Flex vertical="center" gap="m" style={{ marginTop: '1rem' }}>
          <Spinner size="m" />
          <Text variant="body-default-s" onBackground="neutral-weak">
            Loading content...
          </Text>
        </Flex>
      </Card>
    </Flex>
  );
};