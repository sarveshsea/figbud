// Advanced Component Library - Navigation, Feedback, and Data Display
import { designTokens, hexToRgb, createGlassmorphism, getRadius, getSpacing, createDropShadow, createGradientFill } from './designTokens';

// Navigation Bar Component - Modern app navigation
export const createNavbar = async (properties: any = {}) => {
  const {
    logo = 'Logo',
    links = ['Home', 'Products', 'About', 'Contact'],
    variant = 'elevated', // elevated, flat, glass, gradient
    height = 64,
    showSearch = true,
    showActions = true
  } = properties;

  const navbar = figma.createFrame();
  navbar.name = `Navbar/${variant}`;
  navbar.resize(1440, height);
  navbar.layoutMode = 'HORIZONTAL';
  navbar.primaryAxisAlignItems = 'CENTER';
  navbar.counterAxisAlignItems = 'CENTER';
  navbar.paddingLeft = 40;
  navbar.paddingRight = 40;
  navbar.itemSpacing = 40;

  // Apply variant styles
  switch (variant) {
    case 'elevated':
      navbar.fills = [{ type: 'SOLID', color: hexToRgb('#FFFFFF') }];
      navbar.effects = [
        createDropShadow({ r: 0, g: 0, b: 0, a: 0.1 }, { x: 0, y: 2 }, 8)
      ];
      break;
      
    case 'glass':
      const glassStyle = createGlassmorphism();
      navbar.fills = glassStyle.fills as Paint[];
      navbar.effects = glassStyle.effects as Effect[];
      break;
      
    case 'gradient':
      navbar.fills = [createGradientFill([
        hexToRgb(designTokens.colors.primary[900]),
        hexToRgb(designTokens.colors.primary[700])
      ])];
      break;
      
    case 'flat':
      navbar.fills = [{ type: 'SOLID', color: hexToRgb(designTokens.colors.neutral[50]) }];
      break;
  }

  // Logo section
  const logoFrame = figma.createFrame();
  logoFrame.layoutMode = 'HORIZONTAL';
  logoFrame.primaryAxisAlignItems = 'CENTER';
  logoFrame.itemSpacing = 12;
  
  const logoText = figma.createText();
  await figma.loadFontAsync({ family: "Inter", style: "Bold" });
  logoText.characters = logo;
  logoText.fontSize = 24;
  logoText.fontName = { family: "Inter", style: "Bold" };
  logoText.fills = [{ 
    type: 'SOLID', 
    color: variant === 'gradient' ? hexToRgb('#FFFFFF') : hexToRgb(designTokens.colors.neutral[900])
  }];
  logoFrame.appendChild(logoText);
  navbar.appendChild(logoFrame);

  // Navigation links
  const navLinks = figma.createFrame();
  navLinks.layoutMode = 'HORIZONTAL';
  navLinks.primaryAxisAlignItems = 'CENTER';
  navLinks.itemSpacing = 32;
  navLinks.layoutGrow = 1;
  navLinks.primaryAxisAlignItems = 'CENTER';

  for (const link of links) {
    const linkText = figma.createText();
    await figma.loadFontAsync({ family: "Inter", style: "Medium" });
    linkText.characters = link;
    linkText.fontSize = 16;
    linkText.fontName = { family: "Inter", style: "Medium" };
    linkText.fills = [{ 
      type: 'SOLID', 
      color: variant === 'gradient' ? hexToRgb('#FFFFFF') : hexToRgb(designTokens.colors.neutral[700])
    }];
    navLinks.appendChild(linkText);
  }
  navbar.appendChild(navLinks);

  // Search bar
  if (showSearch) {
    const searchBar = figma.createFrame();
    searchBar.resize(240, 40);
    searchBar.layoutMode = 'HORIZONTAL';
    searchBar.primaryAxisAlignItems = 'CENTER';
    searchBar.paddingLeft = 16;
    searchBar.paddingRight = 16;
    searchBar.itemSpacing = 8;
    searchBar.cornerRadius = 20;
    searchBar.fills = [{ 
      type: 'SOLID', 
      color: variant === 'gradient' 
        ? hexToRgb('#FFFFFF')
        : hexToRgb(designTokens.colors.neutral[100]),
      opacity: variant === 'gradient' ? 0.2 : 1
    }];

    const searchText = figma.createText();
    await figma.loadFontAsync({ family: "Inter", style: "Regular" });
    searchText.characters = 'Search...';
    searchText.fontSize = 14;
    searchText.fontName = { family: "Inter", style: "Regular" };
    searchText.fills = [{ 
      type: 'SOLID', 
      color: variant === 'gradient' 
        ? hexToRgb('#FFFFFF')
        : hexToRgb(designTokens.colors.neutral[400]),
      opacity: variant === 'gradient' ? 0.7 : 1
    }];
    searchBar.appendChild(searchText);
    navbar.appendChild(searchBar);
  }

  // Action buttons
  if (showActions) {
    const actions = figma.createFrame();
    actions.layoutMode = 'HORIZONTAL';
    actions.itemSpacing = 16;
    actions.primaryAxisAlignItems = 'CENTER';

    // Notification icon
    const notifIcon = figma.createEllipse();
    notifIcon.resize(40, 40);
    notifIcon.fills = [{ 
      type: 'SOLID', 
      color: variant === 'gradient'
        ? hexToRgb('#FFFFFF')
        : hexToRgb(designTokens.colors.neutral[100]),
      opacity: variant === 'gradient' ? 0.2 : 1
    }];
    actions.appendChild(notifIcon);

    // User avatar
    const avatar = figma.createEllipse();
    avatar.resize(40, 40);
    avatar.fills = [{
      type: 'GRADIENT_RADIAL',
      gradientTransform: [[0.5, 0, 0.5], [0, 0.5, 0.5]],
      gradientStops: [
        { position: 0, color: { ...hexToRgb(designTokens.colors.primary[400]), a: 1 } },
        { position: 1, color: { ...hexToRgb(designTokens.colors.accent[500]), a: 1 } }
      ]
    }];
    actions.appendChild(avatar);

    navbar.appendChild(actions);
  }

  return navbar;
};

// Modal Component - Modern dialog/modal
export const createModal = async (properties: any = {}) => {
  const {
    title = 'Modal Title',
    content = 'This is the modal content. You can add any information here.',
    variant = 'centered', // centered, slideIn, fullscreen
    showOverlay = true,
    width = 480,
    showActions = true
  } = properties;

  const container = figma.createFrame();
  container.name = `Modal/${variant}`;
  container.resize(figma.viewport.bounds.width, figma.viewport.bounds.height);
  container.fills = showOverlay ? [{ 
    type: 'SOLID', 
    color: { r: 0, g: 0, b: 0 },
    opacity: 0.5
  }] : [];
  container.layoutMode = 'VERTICAL';
  container.primaryAxisAlignItems = 'CENTER';
  container.counterAxisAlignItems = 'CENTER';

  // Modal content
  const modal = figma.createFrame();
  modal.resize(width, 400);
  modal.fills = [{ type: 'SOLID', color: hexToRgb('#FFFFFF') }];
  modal.cornerRadius = getRadius('2xl');
  modal.layoutMode = 'VERTICAL';
  modal.paddingLeft = 32;
  modal.paddingRight = 32;
  modal.paddingTop = 32;
  modal.paddingBottom = 32;
  modal.itemSpacing = 24;
  modal.effects = [
    createDropShadow({ r: 0, g: 0, b: 0, a: 0.2 }, { x: 0, y: 20 }, 40, -10)
  ];

  // Header
  const header = figma.createFrame();
  header.layoutMode = 'HORIZONTAL';
  header.counterAxisAlignItems = 'CENTER';
  header.layoutSizingHorizontal = 'FILL';

  const titleText = figma.createText();
  await figma.loadFontAsync({ family: "Inter", style: "Bold" });
  titleText.characters = title;
  titleText.fontSize = 24;
  titleText.fontName = { family: "Inter", style: "Bold" };
  titleText.fills = [{ type: 'SOLID', color: hexToRgb(designTokens.colors.neutral[900]) }];
  titleText.layoutGrow = 1;
  header.appendChild(titleText);

  // Close button
  const closeBtn = figma.createEllipse();
  closeBtn.resize(32, 32);
  closeBtn.fills = [{ type: 'SOLID', color: hexToRgb(designTokens.colors.neutral[100]) }];
  header.appendChild(closeBtn);

  modal.appendChild(header);

  // Content
  const contentText = figma.createText();
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  contentText.characters = content;
  contentText.fontSize = 16;
  contentText.fontName = { family: "Inter", style: "Regular" };
  contentText.fills = [{ type: 'SOLID', color: hexToRgb(designTokens.colors.neutral[600]) }];
  contentText.layoutSizingHorizontal = 'FILL';
  contentText.layoutGrow = 1;
  modal.appendChild(contentText);

  // Actions
  if (showActions) {
    const actions = figma.createFrame();
    actions.layoutMode = 'HORIZONTAL';
    actions.primaryAxisAlignItems = 'CENTER';
    actions.counterAxisAlignItems = 'CENTER';
    actions.itemSpacing = 12;
    actions.layoutSizingHorizontal = 'FILL';

    // Cancel button
    const cancelBtn = figma.createFrame();
    cancelBtn.resize(100, 40);
    cancelBtn.layoutMode = 'HORIZONTAL';
    cancelBtn.primaryAxisAlignItems = 'CENTER';
    cancelBtn.counterAxisAlignItems = 'CENTER';
    cancelBtn.cornerRadius = getRadius('md');
    cancelBtn.fills = [{ type: 'SOLID', color: hexToRgb(designTokens.colors.neutral[100]) }];

    const cancelText = figma.createText();
    await figma.loadFontAsync({ family: "Inter", style: "Medium" });
    cancelText.characters = 'Cancel';
    cancelText.fontSize = 16;
    cancelText.fontName = { family: "Inter", style: "Medium" };
    cancelText.fills = [{ type: 'SOLID', color: hexToRgb(designTokens.colors.neutral[700]) }];
    cancelBtn.appendChild(cancelText);
    actions.appendChild(cancelBtn);

    // Confirm button
    const confirmBtn = figma.createFrame();
    confirmBtn.resize(100, 40);
    confirmBtn.layoutMode = 'HORIZONTAL';
    confirmBtn.primaryAxisAlignItems = 'CENTER';
    confirmBtn.counterAxisAlignItems = 'CENTER';
    confirmBtn.cornerRadius = getRadius('md');
    confirmBtn.fills = [{ type: 'SOLID', color: hexToRgb(designTokens.colors.primary[600]) }];

    const confirmText = figma.createText();
    confirmText.characters = 'Confirm';
    confirmText.fontSize = 16;
    confirmText.fontName = { family: "Inter", style: "Medium" };
    confirmText.fills = [{ type: 'SOLID', color: hexToRgb('#FFFFFF') }];
    confirmBtn.appendChild(confirmText);
    actions.appendChild(confirmBtn);

    modal.appendChild(actions);
  }

  container.appendChild(modal);
  return container;
};

// Toast/Notification Component
export const createToast = async (properties: any = {}) => {
  const {
    message = 'This is a notification message',
    variant = 'success', // success, error, warning, info
    position = 'top-right',
    showIcon = true,
    showClose = true
  } = properties;

  const toast = figma.createFrame();
  toast.name = `Toast/${variant}`;
  toast.resize(360, 64);
  toast.layoutMode = 'HORIZONTAL';
  toast.primaryAxisAlignItems = 'CENTER';
  toast.paddingLeft = 16;
  toast.paddingRight = 16;
  toast.paddingTop = 16;
  toast.paddingBottom = 16;
  toast.itemSpacing = 12;
  toast.cornerRadius = getRadius('md');

  // Variant styles
  const variantStyles = {
    success: {
      bg: designTokens.colors.success.light,
      icon: '✓',
      iconBg: designTokens.colors.success.main
    },
    error: {
      bg: designTokens.colors.error.light,
      icon: '✕',
      iconBg: designTokens.colors.error.main
    },
    warning: {
      bg: designTokens.colors.warning.light,
      icon: '!',
      iconBg: designTokens.colors.warning.main
    },
    info: {
      bg: designTokens.colors.info.light,
      icon: 'i',
      iconBg: designTokens.colors.info.main
    }
  };

  const style = variantStyles[variant] || variantStyles.info;
  toast.fills = [{ type: 'SOLID', color: hexToRgb(style.bg), opacity: 0.1 }];
  toast.strokes = [{ type: 'SOLID', color: hexToRgb(style.bg) }];
  toast.strokeWeight = 1;
  toast.effects = [
    createDropShadow({ r: 0, g: 0, b: 0, a: 0.1 }, { x: 0, y: 4 }, 12)
  ];

  // Icon
  if (showIcon) {
    const iconCircle = figma.createEllipse();
    iconCircle.resize(32, 32);
    iconCircle.fills = [{ type: 'SOLID', color: hexToRgb(style.iconBg) }];

    const iconText = figma.createText();
    await figma.loadFontAsync({ family: "Inter", style: "Bold" });
    iconText.characters = style.icon;
    iconText.fontSize = 16;
    iconText.fontName = { family: "Inter", style: "Bold" };
    iconText.fills = [{ type: 'SOLID', color: hexToRgb('#FFFFFF') }];
    iconText.textAlignHorizontal = 'CENTER';
    iconText.textAlignVertical = 'CENTER';
    
    toast.appendChild(iconCircle);
  }

  // Message
  const messageText = figma.createText();
  await figma.loadFontAsync({ family: "Inter", style: "Medium" });
  messageText.characters = message;
  messageText.fontSize = 14;
  messageText.fontName = { family: "Inter", style: "Medium" };
  messageText.fills = [{ type: 'SOLID', color: hexToRgb(designTokens.colors.neutral[800]) }];
  messageText.layoutGrow = 1;
  toast.appendChild(messageText);

  // Close button
  if (showClose) {
    const closeBtn = figma.createEllipse();
    closeBtn.resize(24, 24);
    closeBtn.fills = [{ type: 'SOLID', color: hexToRgb(designTokens.colors.neutral[300]) }];
    toast.appendChild(closeBtn);
  }

  return toast;
};

// Data Table Component
export const createDataTable = async (properties: any = {}) => {
  const {
    columns = ['Name', 'Email', 'Role', 'Status'],
    rows = 3,
    variant = 'striped', // striped, bordered, minimal
    showHeader = true,
    width = 800
  } = properties;

  const table = figma.createFrame();
  table.name = `Table/${variant}`;
  table.resize(width, (rows + 1) * 48);
  table.layoutMode = 'VERTICAL';
  table.fills = [{ type: 'SOLID', color: hexToRgb('#FFFFFF') }];
  table.cornerRadius = getRadius('lg');
  
  if (variant === 'bordered') {
    table.strokes = [{ type: 'SOLID', color: hexToRgb(designTokens.colors.neutral[200]) }];
    table.strokeWeight = 1;
  }

  // Header
  if (showHeader) {
    const header = figma.createFrame();
    header.resize(width, 48);
    header.layoutMode = 'HORIZONTAL';
    header.fills = [{ type: 'SOLID', color: hexToRgb(designTokens.colors.neutral[50]) }];
    header.paddingLeft = 24;
    header.paddingRight = 24;
    header.primaryAxisAlignItems = 'CENTER';

    for (const column of columns) {
      const headerCell = figma.createText();
      await figma.loadFontAsync({ family: "Inter", style: "Semibold" });
      headerCell.characters = column;
      headerCell.fontSize = 14;
      headerCell.fontName = { family: "Inter", style: "Semibold" };
      headerCell.fills = [{ type: 'SOLID', color: hexToRgb(designTokens.colors.neutral[700]) }];
      headerCell.layoutGrow = 1;
      header.appendChild(headerCell);
    }
    
    table.appendChild(header);
  }

  // Rows
  for (let i = 0; i < rows; i++) {
    const row = figma.createFrame();
    row.resize(width, 48);
    row.layoutMode = 'HORIZONTAL';
    row.paddingLeft = 24;
    row.paddingRight = 24;
    row.primaryAxisAlignItems = 'CENTER';
    
    // Striped background
    if (variant === 'striped' && i % 2 === 1) {
      row.fills = [{ type: 'SOLID', color: hexToRgb(designTokens.colors.neutral[50]) }];
    }

    // Add sample data
    const sampleData = [
      `User ${i + 1}`,
      `user${i + 1}@example.com`,
      i % 2 === 0 ? 'Admin' : 'User',
      i % 3 === 0 ? 'Active' : 'Inactive'
    ];

    for (let j = 0; j < columns.length; j++) {
      const cell = figma.createText();
      await figma.loadFontAsync({ family: "Inter", style: "Regular" });
      cell.characters = sampleData[j] || `Data ${j + 1}`;
      cell.fontSize = 14;
      cell.fontName = { family: "Inter", style: "Regular" };
      cell.fills = [{ type: 'SOLID', color: hexToRgb(designTokens.colors.neutral[600]) }];
      cell.layoutGrow = 1;
      row.appendChild(cell);
    }
    
    table.appendChild(row);
  }

  return table;
};

// Export advanced components
export const advancedComponents = {
  navbar: createNavbar,
  modal: createModal,
  toast: createToast,
  table: createDataTable
};