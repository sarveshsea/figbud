-- Seed data for Once UI component mappings
-- This creates the initial mappings between Once UI components and Figma properties

-- Button component mapping
INSERT INTO once_ui_mappings (component_type, once_ui_component, figma_to_once_props, once_to_figma_props, style_mappings)
VALUES (
  'button',
  'Button',
  '{
    "text": "children",
    "width": "style.width",
    "height": "style.height",
    "backgroundColor": "variant",
    "cornerRadius": "radius",
    "paddingLeft": "style.paddingLeft",
    "paddingRight": "style.paddingRight",
    "paddingTop": "style.paddingTop",
    "paddingBottom": "style.paddingBottom"
  }'::jsonb,
  '{
    "children": "text",
    "variant": "backgroundColor",
    "size": {"small": {"width": 80, "height": 32}, "medium": {"width": 120, "height": 40}, "large": {"width": 160, "height": 48}},
    "radius": "cornerRadius"
  }'::jsonb,
  '{
    "primary": {"backgroundColor": {"r": 0.388, "g": 0.4, "b": 0.965}},
    "secondary": {"backgroundColor": {"r": 0.8, "g": 0.8, "b": 0.8}},
    "danger": {"backgroundColor": {"r": 0.95, "g": 0.3, "b": 0.3}}
  }'::jsonb
);

-- Card component mapping
INSERT INTO once_ui_mappings (component_type, once_ui_component, figma_to_once_props, once_to_figma_props, style_mappings)
VALUES (
  'card',
  'Card',
  '{
    "width": "style.width",
    "height": "style.height",
    "cornerRadius": "radius",
    "padding": "style.padding",
    "backgroundColor": "style.backgroundColor",
    "shadow": "elevation"
  }'::jsonb,
  '{
    "radius": "cornerRadius",
    "padding": {"all": "padding"},
    "elevation": {"0": null, "1": "small", "2": "medium", "3": "large"}
  }'::jsonb,
  '{
    "elevation": {
      "small": {"type": "DROP_SHADOW", "color": {"r": 0, "g": 0, "b": 0, "a": 0.1}, "offset": {"x": 0, "y": 2}, "radius": 8},
      "medium": {"type": "DROP_SHADOW", "color": {"r": 0, "g": 0, "b": 0, "a": 0.15}, "offset": {"x": 0, "y": 4}, "radius": 16},
      "large": {"type": "DROP_SHADOW", "color": {"r": 0, "g": 0, "b": 0, "a": 0.2}, "offset": {"x": 0, "y": 8}, "radius": 24}
    }
  }'::jsonb
);

-- Input component mapping
INSERT INTO once_ui_mappings (component_type, once_ui_component, figma_to_once_props, once_to_figma_props, style_mappings)
VALUES (
  'input',
  'Input',
  '{
    "placeholder": "placeholder",
    "label": "label",
    "width": "style.width",
    "height": "style.height",
    "cornerRadius": "radius",
    "borderColor": "style.borderColor",
    "backgroundColor": "style.backgroundColor"
  }'::jsonb,
  '{
    "placeholder": "placeholder",
    "label": "label",
    "size": {"small": {"height": 32}, "medium": {"height": 40}, "large": {"height": 48}},
    "radius": "cornerRadius",
    "variant": "style"
  }'::jsonb,
  '{
    "default": {
      "backgroundColor": {"r": 0.98, "g": 0.98, "b": 0.98},
      "borderColor": {"r": 0.8, "g": 0.8, "b": 0.8}
    },
    "outlined": {
      "backgroundColor": {"r": 1, "g": 1, "b": 1},
      "borderColor": {"r": 0.6, "g": 0.6, "b": 0.6}
    }
  }'::jsonb
);

-- Text component mapping
INSERT INTO once_ui_mappings (component_type, once_ui_component, figma_to_once_props, once_to_figma_props, style_mappings)
VALUES (
  'text',
  'Text',
  '{
    "characters": "children",
    "fontSize": "size",
    "fontWeight": "weight",
    "textAlign": "align",
    "color": "style.color"
  }'::jsonb,
  '{
    "children": "characters",
    "variant": "style",
    "size": "fontSize",
    "weight": "fontWeight",
    "align": "textAlign"
  }'::jsonb,
  '{
    "body": {"fontSize": 14, "fontWeight": "Regular"},
    "heading": {"fontSize": 24, "fontWeight": "Bold"},
    "caption": {"fontSize": 12, "fontWeight": "Regular"},
    "label": {"fontSize": 14, "fontWeight": "Medium"}
  }'::jsonb
);

-- Badge component mapping
INSERT INTO once_ui_mappings (component_type, once_ui_component, figma_to_once_props, once_to_figma_props, style_mappings)
VALUES (
  'badge',
  'Badge',
  '{
    "text": "children",
    "backgroundColor": "variant",
    "cornerRadius": "radius",
    "paddingHorizontal": "style.paddingX",
    "paddingVertical": "style.paddingY"
  }'::jsonb,
  '{
    "children": "text",
    "variant": "backgroundColor",
    "size": {"small": {"paddingX": 8, "paddingY": 2}, "medium": {"paddingX": 12, "paddingY": 4}},
    "radius": "cornerRadius"
  }'::jsonb,
  '{
    "primary": {"backgroundColor": {"r": 0.388, "g": 0.4, "b": 0.965}, "color": {"r": 1, "g": 1, "b": 1}},
    "secondary": {"backgroundColor": {"r": 0.9, "g": 0.9, "b": 0.9}, "color": {"r": 0.1, "g": 0.1, "b": 0.1}},
    "success": {"backgroundColor": {"r": 0.3, "g": 0.8, "b": 0.3}, "color": {"r": 1, "g": 1, "b": 1}},
    "warning": {"backgroundColor": {"r": 1, "g": 0.7, "b": 0}, "color": {"r": 0, "g": 0, "b": 0}},
    "danger": {"backgroundColor": {"r": 0.95, "g": 0.3, "b": 0.3}, "color": {"r": 1, "g": 1, "b": 1}}
  }'::jsonb
);

-- Flex/Layout component mapping
INSERT INTO once_ui_mappings (component_type, once_ui_component, figma_to_once_props, once_to_figma_props, style_mappings)
VALUES (
  'flex',
  'Flex',
  '{
    "layoutMode": "direction",
    "primaryAxisAlignItems": "justify",
    "counterAxisAlignItems": "align",
    "itemSpacing": "gap",
    "paddingLeft": "style.paddingLeft",
    "paddingRight": "style.paddingRight",
    "paddingTop": "style.paddingTop",
    "paddingBottom": "style.paddingBottom"
  }'::jsonb,
  '{
    "direction": {"row": "HORIZONTAL", "column": "VERTICAL"},
    "justify": {"start": "MIN", "center": "CENTER", "end": "MAX", "between": "SPACE_BETWEEN"},
    "align": {"start": "MIN", "center": "CENTER", "end": "MAX"},
    "gap": "itemSpacing",
    "padding": "padding"
  }'::jsonb,
  null
);

-- Initial component templates
INSERT INTO figma_components (name, type, category, complexity, description, figma_properties, default_props, tags)
VALUES 
(
  'Primary Button',
  'button',
  'form',
  'atomic',
  'A primary action button with blue background',
  '{
    "type": "FRAME",
    "layoutMode": "HORIZONTAL",
    "primaryAxisAlignItems": "CENTER",
    "counterAxisAlignItems": "CENTER",
    "paddingLeft": 24,
    "paddingRight": 24,
    "paddingTop": 12,
    "paddingBottom": 12,
    "cornerRadius": 8,
    "fills": [{"type": "SOLID", "color": {"r": 0.388, "g": 0.4, "b": 0.965}}]
  }'::jsonb,
  '{
    "width": 120,
    "height": 48,
    "label": "Click me"
  }'::jsonb,
  ARRAY['button', 'primary', 'action', 'cta']
),
(
  'Card Container',
  'card',
  'layout',
  'molecule',
  'A card container with shadow and padding',
  '{
    "type": "FRAME",
    "layoutMode": "VERTICAL",
    "itemSpacing": 16,
    "paddingLeft": 24,
    "paddingRight": 24,
    "paddingTop": 24,
    "paddingBottom": 24,
    "cornerRadius": 16,
    "fills": [{"type": "SOLID", "color": {"r": 1, "g": 1, "b": 1}}],
    "effects": [{
      "type": "DROP_SHADOW",
      "color": {"r": 0, "g": 0, "b": 0, "a": 0.1},
      "offset": {"x": 0, "y": 2},
      "radius": 8,
      "visible": true,
      "blendMode": "NORMAL"
    }]
  }'::jsonb,
  '{
    "width": 320,
    "height": 240,
    "title": "Card Title",
    "description": "Card description goes here"
  }'::jsonb,
  ARRAY['card', 'container', 'layout', 'content']
),
(
  'Form Input',
  'input',
  'form',
  'atomic',
  'A form input field with label',
  '{
    "type": "FRAME",
    "layoutMode": "VERTICAL",
    "itemSpacing": 8
  }'::jsonb,
  '{
    "width": 320,
    "height": 48,
    "label": "Email address",
    "placeholder": "Enter your email"
  }'::jsonb,
  ARRAY['input', 'form', 'field', 'text']
);