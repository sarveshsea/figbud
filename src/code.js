// Ultra-minimal ES5 Figma widget - pure JavaScript
var figmaWidget = figma.widget;

function FigBudWidget() {
  var state = figmaWidget.useSyncedState('count', 0);
  var count = state[0];
  var setCount = state[1];

  figmaWidget.usePropertyMenu([
    {
      itemType: 'action',
      tooltip: 'Click to increment',
      propertyName: 'click'
    }
  ], function(event) {
    if (event.propertyName === 'click') {
      figma.notify('FigBud clicked! Count: ' + (count + 1));
      setCount(count + 1);
    }
  });

  return figmaWidget.h('AutoLayout', {
    direction: 'vertical',
    spacing: 8,
    padding: 16,
    fill: '#F24E1E',
    cornerRadius: 8
  }, [
    figmaWidget.h('Text', {
      fontSize: 16,
      fontWeight: 600,
      fill: '#FFFFFF',
      horizontalAlignText: 'center'
    }, 'FigBud'),
    figmaWidget.h('Text', {
      fontSize: 12,
      fill: '#FFFFFF80',
      horizontalAlignText: 'center'
    }, 'Clicks: ' + count)
  ]);
}

figmaWidget.register(FigBudWidget);