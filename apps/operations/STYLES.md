# MELINIA'26 Operations Portal - Style Guide

This document defines the design system, styling conventions, colors, and UI guidelines for the MELINIA'26 college fest operations portal.

---

## Design Philosophy

- **Dark theme only** - No light mode toggle
- **Monochrome base** - Black, grays, and whites for structure
- **Semantic colors** - Red/Yellow/Green only for states (errors/warnings/success)
- **Zero rounded corners** - Square UI throughout (`border-radius: 0`)
- **Industrial aesthetic** - Clean, functional, utilitarian
- **Subtle motion** - Fast transitions (120-180ms)
- **Monospace typography** - IBM Plex Mono for all text

---

## Color Palette

### Monochrome Base (Dark Mode)

```css
/* Backgrounds */
--color-bg: #1f1f1f;                    /* Page background */
--color-surface: #262626;               /* Card surface */
--color-surface-elevated: #2e2e2e;      /* Elevated elements */

/* Borders */
--color-border: #333333;                /* Default border */
--color-border-strong: #4a4a4a;         /* Strong/emphasis border */

/* Text */
--color-text: #f5f5f5;                  /* Primary text (white-ish) */
--color-text-secondary: #b3b3b3;        /* Secondary text (medium gray) */
--color-text-tertiary: #8c8c8c;         /* Tertiary text (dark gray) */

/* Accent (monochrome) */
--color-accent: #ffffff;                /* Pure white accent */
--color-accent-hover: #e5e5e5;          /* Hover state */
--color-accent-muted: #737373;          /* Muted accent */
```

### Tailwind Color Mapping

```
Background:    bg-black (#1f1f1f via CSS var)
Cards:         bg-neutral-950 (#262626), border-neutral-800 (#333333)
Buttons:       bg-stone-50 (whitish cream), hover:bg-white
Text Primary:  text-white
Text Secondary: text-neutral-500, text-neutral-400
Text Tertiary:  text-neutral-600
Borders:       border-neutral-800, border-neutral-700
Hover BG:      hover:bg-neutral-900, hover:bg-neutral-800
```

### Semantic State Colors

Use **ONLY** for states (errors, warnings, success). Never for decoration.

```
Error:
  - bg-red-950/50, border-red-900, text-red-500
  - Tailwind: red-500 (#ef4444)
  
Warning:
  - bg-yellow-950/50, border-yellow-900, text-yellow-500
  - Tailwind: yellow-500 (#f59e0b)
  
Success:
  - bg-green-950/50, border-green-900, text-green-500
  - Tailwind: green-500 (#10b981)
```

---

## Typography

### Font Family

```css
font-family: "IBM Plex Mono", monospace;
```

- **All text** uses IBM Plex Mono (body, headings, code, UI elements)
- Loaded via Google Fonts CDN in `main.tsx`
- Weights: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

### Text Sizes

```
Headings:
  h1: text-2xl font-bold (24px)
  h2: text-3xl font-bold (30px)
  h3: text-lg font-semibold (18px)

Body:
  Base: text-base (16px)
  Small: text-sm (14px)
  Extra small: text-xs (12px)

Buttons:
  sm: text-sm (14px)
  md: text-base (16px)
  lg: text-lg (18px)
```

### Text Colors

```css
/* Headings */
text-white

/* Body text */
text-neutral-300 (primary)
text-neutral-400 (secondary)
text-neutral-500 (tertiary/descriptions)

/* Labels */
text-neutral-300 (form labels)
text-neutral-400 (table headers)

/* Interactive */
text-neutral-400 hover:text-white (nav links)
```

---

## Components

### Buttons

**Location**: `src/ui/Button.tsx`

#### Variants

```tsx
// Primary - Whitish cream button
<Button variant="primary">
  bg-stone-50 text-black border-stone-50
  hover:bg-white hover:border-white
</Button>

// Secondary - Transparent with border
<Button variant="secondary">
  bg-transparent text-neutral-300 border-neutral-700
  hover:bg-neutral-900 hover:border-neutral-600
</Button>

// Ghost - No border, transparent
<Button variant="ghost">
  bg-transparent text-neutral-300 border-transparent
  hover:bg-neutral-900
</Button>
```

#### Sizes

```tsx
size="sm"  // h-8 px-3 text-sm
size="md"  // h-10 px-4 text-base (default)
size="lg"  // h-12 px-6 text-lg
```

#### Usage

```tsx
import { Button } from "@/ui/Button";

<Button variant="primary" size="lg" onClick={handleClick}>
  Sign in
</Button>
```

### Input Fields

**Location**: `src/ui/Input.tsx`

```tsx
<Input
  type="text"
  placeholder="Enter text..."
  className="bg-neutral-950 border-neutral-800 text-white
             focus:ring-2 focus:ring-white"
/>
```

- Background: `bg-neutral-950`
- Border: `border-neutral-800`
- Focus: White ring (`focus:ring-white`)
- Text: White
- Placeholder: `placeholder:text-neutral-600`

### Field Wrapper

**Location**: `src/ui/Field.tsx`

```tsx
<Field label="Email" description="Enter your email" error="Invalid email">
  <Input type="email" />
</Field>
```

- Labels: `text-neutral-300`
- Descriptions: `text-neutral-500`
- Errors: `text-red-500`

### Cards/Surfaces

```tsx
// Standard card
<div className="bg-neutral-950 border border-neutral-800 p-6">
  Content
</div>

// Elevated card (not currently used, but available)
<div className="bg-neutral-900 border border-neutral-800 p-6">
  Content
</div>
```

### Tables

```tsx
<table className="w-full">
  <thead>
    <tr className="border-b border-neutral-800">
      <th className="px-6 py-4 text-left text-xs font-medium text-neutral-400 uppercase">
        Header
      </th>
    </tr>
  </thead>
  <tbody className="divide-y divide-neutral-800">
    <tr className="hover:bg-neutral-900 transition-colors duration-150">
      <td className="px-6 py-4 text-sm text-white">
        Cell content
      </td>
    </tr>
  </tbody>
</table>
```

### Status Badges

```tsx
// Success
<span className="inline-block px-2 py-1 text-xs font-medium border 
                 bg-green-950/50 text-green-500 border-green-900">
  Verified
</span>

// Warning
<span className="inline-block px-2 py-1 text-xs font-medium border 
                 bg-yellow-950/50 text-yellow-500 border-yellow-900">
  Pending
</span>

// Error
<span className="inline-block px-2 py-1 text-xs font-medium border 
                 bg-red-950/50 text-red-500 border-red-900">
  Rejected
</span>

// Neutral
<span className="inline-block px-2 py-1 text-xs font-medium border 
                 bg-neutral-900 text-neutral-500 border-neutral-800">
  Inactive
</span>
```

### Navigation

```tsx
<Link
  to="/path"
  className="px-3 py-1.5 text-sm text-neutral-400 
             hover:text-white hover:bg-neutral-900 
             transition-colors duration-150"
  activeProps={{
    className: "text-white bg-neutral-900"
  }}
>
  Nav Link
</Link>
```

---

## Layout

### Page Container

```tsx
<div className="p-6 max-w-7xl mx-auto space-y-6">
  {/* Page content */}
</div>
```

### Page Header

```tsx
<div className="space-y-1">
  <h2 className="text-3xl font-bold text-white">Page Title</h2>
  <p className="text-neutral-500">Page description</p>
</div>
```

### Grid Layouts

```tsx
// Stats cards (responsive)
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  <StatCard />
  <StatCard />
  <StatCard />
</div>

// Quick actions (responsive)
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <ActionCard />
  <ActionCard />
</div>
```

---

## Motion & Transitions

### Timing

```css
--transition-fast: 120ms ease;
--transition-base: 150ms ease;
```

### Usage

```tsx
// Standard transitions
className="transition-colors duration-150"

// Hover states
className="hover:bg-neutral-900 transition-colors duration-150"

// Transform animations
className="transition-transform duration-120"
```

### Reduced Motion

Automatically handled via CSS:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Spacing Scale

Use Tailwind's default spacing scale:

```
Gap/Space:
  space-y-1  (4px)   - Tight (heading + description)
  space-y-2  (8px)   - Close (form fields)
  space-y-4  (16px)  - Default (sections)
  space-y-6  (24px)  - Loose (page sections)

Padding:
  p-3   (12px)  - Small alerts
  p-4   (16px)  - Cards, buttons
  p-6   (24px)  - Large cards, page sections
  p-8   (32px)  - Login form

Gap:
  gap-1  (4px)   - Navigation items
  gap-2  (8px)   - Button groups
  gap-4  (16px)  - Grid items
  gap-6  (24px)  - Large grid items
```

---

## Borders & Corners

### Border Radius

```css
--radius: 0px;
border-radius: 0; /* NO rounded corners anywhere */
```

Always use `rounded-none` or omit border-radius entirely.

### Border Widths

```
border        (1px) - Default
border-2      (2px) - Emphasis (not commonly used)
```

### Border Colors

```
Default:  border-neutral-800
Strong:   border-neutral-700
Light:    border-neutral-900
```

---

## Focus States

### Focus Ring

```css
--focus-ring: 0 0 0 2px #ffffff;
```

All interactive elements:

```tsx
className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
```

---

## Icons

**Library**: `iconoir-react` (v7.11.0)

### Usage

```tsx
import { Eye, EyeClosed } from "iconoir-react";

<Eye className="w-5 h-5 text-neutral-500" />
```

### Common Sizes

```
w-4 h-4  (16px) - Small icons
w-5 h-5  (20px) - Default icons
w-6 h-6  (24px) - Large icons
```

### Icon Colors

```
Inactive:  text-neutral-500
Hover:     text-neutral-300
Active:    text-white
```

---

## Forms

### Form Field Pattern

```tsx
<Field label="Field Label" description="Help text" error={error}>
  <Input
    type="text"
    value={value}
    onChange={(e) => setValue(e.target.value)}
    placeholder="Placeholder text..."
    disabled={isLoading}
  />
</Field>
```

### Input States

```
Default:   bg-neutral-950 border-neutral-800
Focus:     ring-2 ring-white
Disabled:  opacity-50 pointer-events-none
Error:     border-red-500 (if needed)
```

### Select Dropdowns

```tsx
<select className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 
                   text-white focus:outline-none focus:ring-2 focus:ring-white 
                   transition-colors duration-150">
  <option value="all">All</option>
  <option value="active">Active</option>
</select>
```

---

## Error Handling

### Error Messages

```tsx
<div className="p-3 bg-red-950/50 border border-red-900 text-sm text-red-500">
  Error message here
</div>
```

### Warning Messages

```tsx
<div className="p-4 bg-yellow-950/50 border border-yellow-900 text-yellow-500 text-sm">
  Warning message here
</div>
```

### Success Messages

```tsx
<div className="p-4 bg-green-950/50 border border-green-900 text-green-500 text-sm">
  ✓ Success message here
</div>
```

---

## Loading States

### Spinner (if needed)

Use text-based loading:

```tsx
{isLoading ? "Loading..." : "Content"}
```

### Disabled States

```tsx
<Button disabled={isLoading}>
  {isLoading ? "Saving..." : "Save"}
</Button>
```

---

## Accessibility

### ARIA Labels

Always provide labels for form inputs:

```tsx
<label htmlFor="email" className="block text-sm font-medium text-neutral-300">
  Email
</label>
<Input id="email" type="email" />
```

### Focus Management

- All interactive elements must have visible focus states
- Use `focus-visible:ring-2 focus-visible:ring-white`
- Maintain logical tab order

### Color Contrast

- White text on black background: WCAG AAA compliant
- Semantic colors meet WCAG AA standards
- Button text (black on stone-50): High contrast

---

## Best Practices

### Do's ✓

- Use monochrome colors (black, gray, white) for structure
- Use semantic colors (red/yellow/green) ONLY for states
- Keep transitions fast (120-180ms)
- Use square corners everywhere (`rounded-none`)
- Use IBM Plex Mono for all text
- Maintain consistent spacing (Tailwind scale)
- Provide clear focus states
- Use proper semantic HTML

### Don'ts ✗

- Don't use rounded corners
- Don't use semantic colors for decoration
- Don't use fonts other than IBM Plex Mono
- Don't use slow animations (>180ms)
- Don't mix color schemes
- Don't skip focus states
- Don't use inline styles (use Tailwind classes)
- Don't add light mode

---

## File Structure

```
src/
├── styles.css          # Global styles, CSS variables
├── ui/
│   ├── Button.tsx      # Button component
│   ├── Input.tsx       # Input component
│   ├── Field.tsx       # Field wrapper component
│   └── cx.ts           # className merge utility
└── routes/
    └── *.tsx           # Page components (follow style guide)
```

---

## Development Workflow

### Adding New Components

1. Check if Base UI component exists
2. Create wrapper in `src/ui/` if needed
3. Apply dark theme styling
4. Use `rounded-none` for square corners
5. Add proper focus states
6. Test with keyboard navigation
7. Verify color contrast

### Styling New Pages

1. Use page container: `p-6 max-w-7xl mx-auto space-y-6`
2. Add page header with title + description
3. Use cards: `bg-neutral-950 border border-neutral-800`
4. Apply hover states: `hover:bg-neutral-900 transition-colors duration-150`
5. Use semantic colors only for states
6. Test responsive breakpoints (md, lg)

---

## Resources

- **Tailwind CSS**: https://tailwindcss.com/docs
- **Base UI**: https://base-ui.com
- **Iconoir React**: https://iconoir.com
- **IBM Plex Mono**: https://fonts.google.com/specimen/IBM+Plex+Mono
- **WCAG Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/

---

## Version

- **Version**: 1.0.0
- **Last Updated**: 2026-02-05
- **Maintained By**: MELINIA'26 Operations Team
