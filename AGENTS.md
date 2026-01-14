# Melinia'26 Outreach Landing Page - Agent Context

## Project Overview

Creating a **Spider-Man: Into the Spider-Verse themed** outreach landing page for Melinia'26 college fest. Built with **React + Vite + Tailwind CSS v4** in a **Turborepo monorepo** structure using **Bun** as package manager.

---

## What Was Completed

### 1. HudButton Component Integration

Created a reusable animated HUD-style button component:

**Files Created:**

- `apps/outreach/src/components/ui/hud-button.tsx` - Main button component
- `apps/outreach/src/components/ui/hyper-text.tsx` - Text scramble animation dependency
- `apps/outreach/src/lib/utils.ts` - `cn()` utility for class merging
- `apps/outreach/src/pages/HudButtonDemo.tsx` - Demo page for buttons
- `apps/outreach/src/types/theme.ts` - Color palette constants

**Installed Dependencies:** `clsx`, `tailwind-merge`

**Button Features:**

- 2 styles: `style1` (diagonal), `style2` (hexagonal)
- 4 variants: `primary`, `secondary`, `purple`, `red`
- 3 sizes: `small`, `default`, `large`
- SVG-based graphics with animations
- HyperText component for letter-by-letter animation
- Shimmer effect on hover (primary/purple/red variants)

### 2. Hero Section Updates

Modified `apps/outreach/src/components/outreach/Hero.tsx`:

**Removed Elements:**

- Glitch effect from main logo (cleaned up glitch CSS from `index.css`)
- College logo and "Department of Computing" section

**Updated Features:**

- Replaced Login/Register buttons with HudButton components
- **Login**: `variant="purple"` → navigates to `/login`
- **Register**: `variant="red"` → navigates to `/register`
- Logo replaced with SVG from `https://cdn.melinia.in/mln-logo.svg`
- Added shimmer effect using `mask-image` (only affects letters/graphics)
- Added hover effects: scale 1.02x, brightness 1.1x, purple glow
- Added mouse scroll icon at bottom center with bounce animation (using `MouseScrollWheel` from iconoir-react)
- Added top left corner with CIT logo, melinia-top-logo, and "Department of Computing" text
- Horizontal line between logos: 2px thick, white color

### 3. Typography Updates

Added new fonts for Spider-Verse aesthetic:

**New Fonts** (`src/index.css`):

- **Space Grotesk** - For headings (h1-h6)
- **Inter** - For body text

**Font Variables**:

```css
--font-heading: "Space Grotesk", sans-serif;
--font-body: "Inter", sans-serif;
```

**Applied Styles**:

```css
body {
    font-family: var(--font-body), sans-serif;
}
h1,
h2,
h3,
h4,
h5,
h6 {
    font-family: var(--font-heading), sans-serif;
}
```

### 4. Countdown Section

Created glassy rounded corner countdown timer section:

**Files Created:**

- `apps/outreach/src/components/ui/badge.tsx` - Shadcn Badge component
- `apps/outreach/src/components/ui/countdown-timer.tsx` - Main countdown component
- `apps/outreach/src/components/ui/floating-paths.tsx` - Animated SVG paths background
- `apps/outreach/src/components/outreach/CountdownSection.tsx` - Section wrapper

**Installed Dependencies:** `@number-flow/react`, `class-variance-authority`, `motion`

**Countdown Features:**

- Target date: Feb 25, 2026, 8:00 AM IST
- Clean minimal design - no card containers
- **FloatingPathsBackground** with animated SVG paths (motion/react)
- **NumberFlow** for smooth digit switching animations
- **Separator lines** between countdown units with red (#FF0066) to pink (#FF69B4) gradient + fade effect
- Inter font (font-sans) for labels
- Labels: "Days", "Hours", "Minutes", "Seconds" with red-pink gradient text
- Responsive: 4x1 grid on mobile, single row on desktop
- Spreading: Gap scales from gap-4 (mobile) to gap-40 (2xl desktop)
- Title: "Ready. Set. Fest."
- Seamless fade transition between Hero and CountdownSection (30% opacity match at boundary)
- On zero: Shows `00 00 00 00` briefly, then hides section

**Design Specs:**

| Element         | Tailwind/Style                                                                          |
| --------------- | --------------------------------------------------------------------------------------- |
| Background      | FloatingPathsBackground with 36 animated paths + gradient overlays                      |
| Card Shape      | None (clean minimal design)                                                             |
| Separator Lines | Red (#FF0066) to pink (#FF69B4) gradient, 2px width, 70% height, fade at edges          |
| Digit Width     | `max-w-[140px] md:max-w-[320px] lg:max-w-[440px] xl:max-w-[560px] 2xl:max-w-[640px]`    |
| Digit Color     | `text-white`                                                                            |
| Label Color     | `bg-gradient-to-r from-[#FF0066] to-[#FF69B4] bg-clip-text text-transparent` (red-pink) |
| Label Font      | `font-sans` (Inter)                                                                     |
| Digit Size      | `text-3xl md:text-5xl lg:text-7xl xl:text-8xl 2xl:text-9xl`                             |
| Section Fade    | Hero bottom 30% + Countdown top 30% for seamless blend                                  |

### 5. Color Palette

Stored Spider-Verse theme colors:

**CSS Variables** (`src/index.css`):

```css
--color-black: #000000 --color-purple: #9d00ff --color-red: #ff0066 --color-blue: #0066ff
    --color-white: #ffffff;
```

**TypeScript Constants** (`src/types/theme.ts`):

```ts
export const themeColors = {
    black: "#000000",
    purple: "#9D00FF",
    red: "#FF0066",
    blue: "#0066FF",
    white: "#FFFFFF",
} as const
```

### 6. Mobile Responsive Design

HudButton now uses responsive Tailwind classes:

| Breakpoint | Width          | Height     | Text Size     |
| ---------- | -------------- | ---------- | ------------- |
| Mobile     | `w-28` (112px) | `h-9`      | `text-[10px]` |
| Desktop    | `w-[140px]`    | `h-[39px]` | `text-xs`     |

### 7. Video First-Frame Poster

Implemented automatic poster generation in Hero.tsx:

- Creates hidden video element, seeks to frame 0
- Draws to canvas and converts to JPEG data URL
- Displays as background while main video loads
- Fades out when video is ready
- Uses `crossOrigin="anonymous"` for canvas access

### 8. Logo Size Adjustments

Reduced logo sizes for better proportions:

- Mobile: `w-64` (256px) — was `w-80`
- Tablet: `w-80` (320px) — was `[28rem]`
- Desktop: `w-[22rem]` (352px) — was `[36rem]`
- XL: `w-[26rem]` (416px) — was `[40rem]`
- 2XL: `w-[32rem]` (512px) — was `[48rem]`

---

## Current File Structure

```
apps/outreach/src/
├── components/
│   ├── ui/
│   │   ├── hud-button.tsx         (New - animated button component)
│   │   ├── hyper-text.tsx         (New - text scramble animation)
│   │   ├── badge.tsx              (New - shadcn badge component)
│   │   ├── countdown-timer.tsx     (New - minimal countdown timer)
│   │   └── floating-paths.tsx      (New - animated SVG paths background)
│   └── outreach/
│       ├── Hero.tsx                (New - main hero section)
│       ├── CountdownSection.tsx    (New - countdown section wrapper)
│       ├── FooterSection.tsx       (New - footer with map & contact)
│       ├── EventsSection.tsx       (New - events showcase with category filtering)
│       ├── PrizePoolSection.tsx    (New - prize pool counter animation)
│       └── FAQSection.tsx          (New - FAQ accordion with HUD styling)
├── lib/
│   ├── axios.ts                   (Existing)
│   └── utils.ts                  (New - cn() utility)
├── types/
│   ├── api.ts                    (Existing)
│   ├── auth.ts                   (Existing)
│   └── theme.ts                  (New - color palette)
├── pages/
│   ├── HudButtonDemo.tsx          (New - button showcase)
│   └── outreach/
│       └── Home.tsx              (New - Hero, Countdown, Events, PrizePool, FAQ, Footer sections)
├── App.tsx                      (Modified - / route now shows OutreachHome)
└── index.css                    (Modified - removed glitch CSS, added color vars, animations)
```

---

## Design Decisions & Constraints

| Decision       | Choice                           | Rationale                                |
| -------------- | -------------------------------- | ---------------------------------------- |
| Button Colors  | Purple (#9D00FF) / Red (#FF0066) | User's eye-friendly color palette        |
| Next-themes    | Not used                         | Next.js-only, doesn't work with Vite     |
| Logo Format    | SVG                              | User requested mln-logo.svg              |
| Shimmer Effect | mask-image with SVG              | Only affects letters, not full rectangle |
| Video Poster   | Canvas extraction                | No separate poster image file needed     |
| Positioning    | Buttons relative to logo bottom  | `translate-y-[140%]` adjustable          |
| Navigation     | react-router-dom                 | Project uses Vite, not Next.js           |
| Route          | `/` route shows OutreachHome     | Simplified routing for landing page      |

---

## Recent Changes

### Latest Commit (c305c6c)

**Date:** January 13, 2026
**Branch:** `rework-home`
**Commit:** feat: redesign outreach landing page with Spider-Verse theme

**Changes:**

- Outreach landing page now served at `/` (no longer at `/outreach`)
- Removed old home components (events, prize pool, sponsors, people)
- Added AGENTS.md documentation file
- Full Spider-Verse themed redesign complete
- Hero, Countdown, Footer sections live at root URL

---

## Remaining Work

The original plan included **4 sections total**. Completed:

1. ✅ Hero Section
2. ✅ **Countdown Section** - Event countdown timer (Feb 25, 2026, 8AM)
3. ✅ **Footer Section** - Contact/social links
4. ✅ **FAQ Section** - FAQ accordion with HUD styling

All 4 planned sections are now complete!

---

## Additional Sections Completed

### 9. Footer Section

Created 3-column footer with map and contact info:

**Files Created:**

- `apps/outreach/src/components/outreach/FooterSection.tsx` - Footer component

**Layout:** 3-column grid (Map | Contact | Quick Links)

| Column             | Content                                                         |
| ------------------ | --------------------------------------------------------------- |
| **1. Map**         | Google Maps embed (CIT Coimbatore) with rounded corners         |
| **2. Contact**     | Location, Email, Phone with iconoir icons (MapPin, Mail, Phone) |
| **3. Quick Links** | Login, Register, Events (/app/events) with ArrowUpRight icons   |

**FooterSection Features:**

- Spider-Man webp background with overlay
- Hover animations on ArrowUpRight icons (`-translate-y-0.5 translate-x-0.5`)
- Red-pink gradient for icons (#FF0066 to #FF69B4)
- Responsive: 1 column on mobile, 3 columns on desktop
- Grid gap: `gap-12`
- Contact heading: "Contact" with `font-heading` (Space Grotesk)
- Copyright: "© Melinia 2026 Department of Computing" with `font-body` (Inter)

**Contact Details:**

- Address: Civil Aerodrome Post, Coimbatore, Tamilnadu, India – 641 014
- Email: helpdesk@melinia.in
- Phone: +91 9597970123

### 10. FAQ Section

Created HUD-style FAQ accordion section with diagonal cut corners:

**Files Created:**

- `apps/outreach/src/components/outreach/FAQSection.tsx` - Main FAQ component

**FAQ Data (6 questions):**

1. **Registration** - How do I register for events?
2. **Eligibility** - Who can participate in Melinia'26?
3. **Payment** - What payment methods are accepted?
4. **Accommodation** - Is accommodation available for outstation participants?
5. **Team Size** - Can I participate solo or do I need a team?
6. **Contact** - Who should I contact for additional queries?

**FAQ Section Features:**

- **Card Design:** HUD-style with diagonal cut corners (2% cuts)
    - CSS clip-path for card shape
    - SVG background with purple gradient overlay
    - Purple border stroke on SVG path

- **Corner Dots:** 4 dots at diagonal corners
    - Positioned at 2% from edges, 10% from top/bottom
    - Purple color (#9D00FF) with glow effect
    - Pulsing animation (0.7 → 1 → 0.7 over 2 seconds)

- **Accordion Behavior:** Single expansion mode
    - Opening one FAQ closes others automatically
    - Smooth expand/collapse animations using framer-motion
    - Plus icon rotates 45° when expanded

- **Plus Button:**
    - Style matches Events section rounds card
    - Rounded square with zinc-800/50 background
    - Pink icon (#FF0066) with drop-shadow glow
    - Events card glitch effect on hover (x/y jitter)

- **Background:** FloatingPathsBackground with animated SVG paths

- **Heading Underline:** Mirrored from Events section
    - Rotation: `rotate-[2deg]` (mirrored from Events' `rotate-[-2deg]`)
    - Height: `h-2` matches Events section
    - Shadow: `shadow-[0_0_15px_rgba(255,0,102,0.8)]`

**Design Specs:**

| Element       | Tailwind/Style                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------------- |
| Card Shape    | CSS clip-path: `polygon(2% 0%, 98% 0%, 100% 10%, 100% 90%, 98% 100%, 2% 100%, 0% 90%, 0% 10%)`     |
| Background    | bg-zinc-900/90 with SVG purple gradient overlay                                                    |
| Corner Dots   | 4px × 4px, purple #9D00FF, 10% from top/bottom edges, pulsing animation, glow effect               |
| Plus Button   | p-1.5 md:p-2, rounded, bg-zinc-800/50, pink #FF0066 with drop-shadow glow                          |
| Glitch Effect | x/y jitter on card hover (framer-motion variants)                                                  |
| Typography    | Questions: Space Grotesk (font-heading), white, semibold                                           |
|               | Answers: Inter (font-body), gray-300, leading-relaxed                                              |
| Animations    | Card entrance (staggered spring), expand/collapse (height + opacity), pulse (dots), glitch (hover) |

**CSS Animation Added:**

```css
@keyframes dotPulse {
    0%,
    100% {
        opacity: 0.7;
        transform: scale(1);
    }
    50% {
        opacity: 1;
        transform: scale(1.2);
    }
}
```

---

## Recent Commits (feat/faq-section branch)

### Commit 0d33548 (Jan 14, 2026)

**Message:** `style: mirror heading underline in FAQ section`

**Changes:**

- Copy Events heading underline div to FAQ section
- Mirror rotation: `rotate-[2deg]` instead of `rotate-[-2deg]`
- Match underline height and shadow from Events section

### Commit a96d686 (Jan 14, 2026)

**Message:** `feat: add FAQ section with HUD-style accordion`

**Changes:**

- Create FAQSection component with diagonal cut corners and pulsing dot accents
- Implement single-expand accordion with smooth framer-motion animations
- Add dotPulse keyframes animation for corner dots glow effect
- Integrate FAQ section into Home page before Footer
- Remove obsolete Home.tsx redirect page
- Update AGENTS.md with comprehensive FAQ documentation

**Files Changed:** 5 files, 410 insertions(+), 12 deletions(-)

---

## Technical Requirements

- **Theme**: Spider-Man: Into the Spider-Verse (cyan/magenta/purple, glitch effects, comic-style)
- **Responsiveness**: Mobile-first, must work well on mobile
- **Animations**: Use Framer Motion wherever possible
- **Assets**: All from `https://cdn.melinia.in`
- **Design**: Modern UI, good colors, Spider-Verse aesthetic
- **Package Manager**: Bun (not npm/pnpm)

---

## Build Status

```bash
$ bun run build
✓ built successfully
dist/assets/index-*.css   71.60 kB
dist/assets/index-*.js   ~1006 kB
```

All builds passing without errors.

---

## Key Files Reference

- Hero component: `apps/outreach/src/components/outreach/Hero.tsx`
- Countdown Section: `apps/outreach/src/components/outreach/CountdownSection.tsx`
- Countdown Timer: `apps/outreach/src/components/ui/countdown-timer.tsx`
- Badge component: `apps/outreach/src/components/ui/badge.tsx`
- Footer Section: `apps/outreach/src/components/outreach/FooterSection.tsx`
- Styles: `apps/outreach/src/index.css`
- Theme types: `apps/outreach/src/types/theme.ts`
- Button component: `apps/outreach/src/components/ui/hud-button.tsx`
- Home page: `apps/outreach/src/pages/outreach/Home.tsx`

---

## Next Task

Build the **Events Section** - the final of 4 planned sections. This should showcase events/competitions with Spider-Verse aesthetic.
