# iPhone Safe Area Implementation

## Overview

Implemented comprehensive safe area support for iPhone PWA to handle the notch, Dynamic Island, and home indicator correctly.

## Changes Made

### 1. index.html
Already configured with:
- ✅ `viewport-fit=cover` in viewport meta tag
- ✅ `apple-mobile-web-app-status-bar-style` set to `black-translucent`

### 2. index.css

Added comprehensive safe area support:

#### CSS Variables
```css
--safe-area-inset-top: env(safe-area-inset-top, 0px);
--safe-area-inset-right: env(safe-area-inset-right, 0px);
--safe-area-inset-bottom: env(safe-area-inset-bottom, 0px);
--safe-area-inset-left: env(safe-area-inset-left, 0px);
```

#### Automatic Body Padding
The body automatically applies safe area insets to prevent content from being hidden by the notch or home indicator.

#### Utility Classes

**Padding Classes:**
- `.safe-top` - Padding top for notch
- `.safe-bottom` - Padding bottom for home indicator
- `.safe-left` / `.safe-right` - Horizontal safe areas
- `.safe-x` - Both horizontal safe areas
- `.safe-y` - Both vertical safe areas
- `.safe-all` - All safe areas

**Margin Classes:**
- `.safe-mt` / `.safe-mr` / `.safe-mb` / `.safe-ml`

**Height Classes:**
- `.h-screen-safe` - Full height minus safe areas
- `.min-h-screen-safe` - Min height minus safe areas
- `.h-screen-full` - Full viewport height including safe areas

## Usage Examples

### Fixed Navigation Bar
```tsx
<nav className="fixed top-0 w-full safe-top safe-x bg-background">
  {/* Content */}
</nav>
```

### Fixed Bottom Bar
```tsx
<div className="fixed bottom-0 w-full safe-bottom safe-x bg-background">
  {/* Content */}
</div>
```

### Full Screen Container
```tsx
<div className="h-screen-safe">
  {/* Content fits perfectly between notch and home indicator */}
</div>
```

### Sidebar with Safe Areas
```tsx
<aside className="safe-left safe-y">
  {/* Content respects safe areas */}
</aside>
```

## Best Practices

1. **Fixed Elements**: Always use `safe-top` or `safe-bottom` on fixed positioned elements
2. **Full Height**: Use `h-screen-safe` instead of `h-screen` for content containers
3. **Horizontal Padding**: Use `safe-x` for elements that span full width
4. **Testing**: Test on actual iPhone with notch (iPhone X and later)

## Browser Support

- ✅ iPhone X and later (with notch/Dynamic Island)
- ✅ Graceful fallback to 0px on devices without safe areas
- ✅ Works in Safari and Chrome on iOS
- ✅ No impact on Android or desktop browsers

## Testing Checklist

- [ ] Test on iPhone with notch in portrait mode
- [ ] Test on iPhone with notch in landscape mode
- [ ] Test with different status bar styles
- [ ] Verify fixed navigation doesn't overlap with notch
- [ ] Verify bottom navigation doesn't overlap with home indicator
- [ ] Test in both light and dark mode

## Notes

- The `env()` function automatically provides the correct insets
- Fallback to `0px` ensures compatibility with non-iPhone devices
- Safe areas are applied automatically to `body`, but you can override with utility classes
- The `viewport-fit=cover` meta tag is required for safe areas to work
