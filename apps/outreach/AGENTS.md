# Melinia'26 Outreach Landing Page - Agent Context

## Project Overview

Creating a **Spider-Man: Into the Spider-Verse themed** outreach landing page for Melinia'26 college fest. Built with **React + Vite + Tailwind CSS v4** in a **Turborepo monorepo** structure using **Bun** as package manager.

---

## Completed Tasks Summary

### Components Built

| #   | Component            | Description                                                        |
| --- | -------------------- | ------------------------------------------------------------------ |
| 1   | **HudButton**        | Animated HUD-style button with 2 styles, 4 variants, 3 sizes       |
| 2   | **HudCard**          | Glass-morphism card with header, tag variants                      |
| 3   | **HudProfileCard**   | Profile card with tilt effect for team section                     |
| 4   | **HyperText**        | Text scramble animation component                                  |
| 5   | **Badge**            | Shadcn-style badge component                                       |
| 6   | **CountdownTimer**   | Minimal countdown with NumberFlow animations                       |
| 7   | **FloatingPaths**    | Animated SVG paths background                                      |
| 8   | **Hero**             | Main hero with video, logo, shimmer effects                        |
| 9   | **CountdownSection** | Event countdown with title and separator lines                     |
| 10  | **EventsSection**    | Event showcase with category filtering, rounds, prizes, organizers |
| 11  | **PrizePoolSection** | Animated prize pool counter with Indian numbering                  |
| 12  | **FAQSection**       | FAQ accordion with HUD styling                                     |
| 13  | **FooterSection**    | Footer with map and contact info                                   |
| 14  | **PeopleSection**    | Team section with tilted profile cards                             |

### Pages Created

- **Home.tsx** - Landing page combining Hero, Countdown, Events, PrizePool, FAQ, Footer, People

### Key Features Implemented

- Spider-Verse themed UI with purple/red color palette
- Responsive design (mobile-first approach)
- Touch swipe navigation for events
- Smooth animations with Framer Motion
- Category filtering with auto-sync on navigation
- Video first-frame poster generation
- Animated grid background with spotlight effect
- Random tilt cards for team section
- Prize pool animation with counting effect

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
├── App.tsx
├── components/
│   ├── outreach/
│   │   ├── Countdown.tsx
│   │   ├── Events.tsx
│   │   ├── FAQ.tsx
│   │   ├── Footer.tsx
│   │   ├── Hero.tsx
│   │   ├── People.tsx
│   │   └── PrizePool.tsx
│   ├── payment/
│   │   └── PaymentModal.tsx
│   ├── registration/
│   │   ├── EmailForm.tsx
│   │   ├── OtpForm.tsx
│   │   └── PasswordForm.tsx
│   ├── Router.tsx
│   ├── ui/
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── countdown-timer.tsx
│   │   ├── dialog-box.tsx
│   │   ├── floating-paths.tsx
│   │   ├── gesture-toaster.tsx
│   │   ├── hud-button.tsx
│   │   ├── hud-card.tsx
│   │   ├── hud-profile-card.tsx
│   │   ├── hyper-text.tsx
│   │   └── spinner.tsx
│   └── userland/
│       ├── events/
│       │   └── EventsCard.tsx
│       ├── main/
│       │   ├── NotificationIcon.tsx
│       │   ├── Notifications.tsx
│       │   ├── QRCode.tsx
│       │   └── UserCard.tsx
│       ├── Navigator.tsx
│       └── teams/
│           ├── TeamDetailsPanel.tsx
│           ├── TeamForm.tsx
│           ├── TeamList.tsx
│           └── TeamModel.tsx
├── lib/
│   ├── axios.ts
│   └── utils.ts
├── main.tsx
├── pages/
│   ├── Home.tsx
│   └── userland/
│       ├── auth/
│       │   ├── ForgotPassword.tsx
│       │   ├── Login.tsx
│       │   ├── Registration.tsx
│       │   └── ResetPassword.tsx
│       ├── events/
│       │   ├── EventDetail.tsx
│       │   ├── EventRegister.tsx
│       │   └── Events.tsx
│       ├── Layout.tsx
│       ├── Leaderboard.tsx
│       ├── Main.tsx
│       ├── Profile.tsx
│       └── Teams.tsx
├── services/
│   ├── api.ts
│   ├── auth.ts
│   ├── payment.ts
│   ├── teams.ts
│   └── users.ts
├── types/
│   ├── api.ts
│   ├── auth.ts
│   ├── people.ts
│   └── theme.ts
└── vite-env.d.ts
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

## Recent Updates (Jan 14, 2026)

### 11. HudCardHeader Icon Color Fix

**Modified:** `apps/outreach/src/components/ui/hud-card.tsx`

**Change:** Icons in HudCardHeader now match the variant color instead of always being white.

**Before:**

```tsx
{
    icon && <span className="text-white text-xs md:text-base">{icon}</span>
}
```

**After:**

```tsx
{
    icon && (
        <span className="text-xs md:text-base" style={{ color: colors.main }}>
            {icon}
        </span>
    )
}
```

### 12. Events Section Improvements

**Modified:** `apps/outreach/src/components/outreach/EventsSection.tsx`

**Changes:**

- **Organizer Info:** Changed HudTag size from `small` to `medium` for larger names, reduced phone font from `md:text-2xl` to `md:text-lg`

- **Rounds Accordion:** Single expansion mode - opening one round automatically closes others

- **Meta Info Grid:** Changed from single column to 2-column layout on tablet+ (`grid-cols-1 md:grid-cols-2`)

- **Fixed Card Height:** Added `h-24` fixed height for description area with scroll on expand, removed fixed height from main card

- **Prize Cards Redesign:**
    - Removed "Position" label
    - Added Award icon with gold (#FFD700), silver (#C0C0C0), bronze (#CD7F32) colors
    - Rank displayed as 1st, 2nd, 3rd format
    - Applied matching color to prize amount

### 13. PrizePoolSection Animation Redesign

**Modified:** `apps/outreach/src/components/outreach/PrizePoolSection.tsx`

**Animation Sequence:**

1. "+ Pull" slides in from left to right over 1 second
2. Only after + animation completes, the number fades in and starts counting up
3. Indian numbering format (`₹1,00,000`) using `locales="en-IN"`

**Added:** `getPrizeColor()` helper function for gold/silver/bronze colors

**Title Style:** Added FAQ-style title with gradient underline and mirrored rotation (`-rotate-[2deg]`)

### 14. People Section

**Files Created:**

- `apps/outreach/src/components/outreach/PeopleSection.tsx` - Team section with tilted cards
- `apps/outreach/src/components/ui/hud-profile-card.tsx` - Profile card component
- `apps/outreach/src/types/people.ts` - Person type and sample data

**Features:**

- Random tilt effect for each card
- Color-coded by category (organizer: purple, faculty: blue, dev-team: red)
- Initials display with gradient background
- LinkedIn link integration
- Pulsing glow effect on hover

**Categories:**

- **Organizer** (#9D00FF) - Event organizers
- **Faculty** (#0066FF) - Faculty coordinators
- **Dev Team** (#FF0066) - Technical team members

### 15. Events Section Cover Image & Filter Sync

**Modified:** `apps/outreach/src/components/outreach/EventsSection.tsx`

**Changes:**

- **Cover Image Placeholder Size:** Changed aspect ratio from `aspect-[3/2]` to `aspect-[4/1] md:aspect-[16/6]` on mobile, making the image height 25% of its width

- **Category Filter Sync:** Added a `useEffect` that automatically updates the `activeFilter` to match the current event's type when navigating (swiping or using next/prev buttons)

---

## Updated File Structure

```
apps/outreach/src/
├── components/
│   ├── outreach/
│   │   ├── Countdown.tsx
│   │   ├── Events.tsx
│   │   ├── FAQ.tsx
│   │   ├── Footer.tsx
│   │   ├── Hero.tsx
│   │   ├── People.tsx
│   │   └── PrizePool.tsx
│   ├── payment/
│   │   └── PaymentModal.tsx
│   ├── registration/
│   │   ├── EmailForm.tsx
│   │   ├── OtpForm.tsx
│   │   └── PasswordForm.tsx
│   ├── Router.tsx
│   ├── ui/
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── countdown-timer.tsx
│   │   ├── dialog-box.tsx
│   │   ├── floating-paths.tsx
│   │   ├── gesture-toaster.tsx
│   │   ├── hud-button.tsx
│   │   ├── hud-card.tsx
│   │   ├── hud-profile-card.tsx
│   │   ├── hyper-text.tsx
│   │   └── spinner.tsx
│   └── userland/
│       ├── events/
│       │   └── EventsCard.tsx
│       ├── main/
│       │   ├── NotificationIcon.tsx
│       │   ├── Notifications.tsx
│       │   ├── QRCode.tsx
│       │   └── UserCard.tsx
│       ├── Navigator.tsx
│       └── teams/
│           ├── TeamDetailsPanel.tsx
│           ├── TeamForm.tsx
│           ├── TeamList.tsx
│           └── TeamModel.tsx
├── lib/
│   ├── axios.ts
│   └── utils.ts
├── pages/
│   ├── Home.tsx
│   └── userland/
│       ├── auth/
│       │   ├── ForgotPassword.tsx
│       │   ├── Login.tsx
│       │   ├── Registration.tsx
│       │   └── ResetPassword.tsx
│       ├── events/
│       │   ├── EventDetail.tsx
│       │   ├── EventRegister.tsx
│       │   └── Events.tsx
│       ├── Layout.tsx
│       ├── Leaderboard.tsx
│       ├── Main.tsx
│       ├── Profile.tsx
│       └── Teams.tsx
├── services/
│   ├── api.ts
│   ├── auth.ts
│   ├── payment.ts
│   ├── teams.ts
│   └── users.ts
└── types/
    ├── api.ts
    ├── auth.ts
    ├── people.ts
    └── theme.ts
```

---

## Recent Commits (master branch)

| Commit    | Message                                                                          |
| --------- | -------------------------------------------------------------------------------- |
| `7a9b3c1` | feat: add category filter sync and cover image size adjustment                   |
| `77207d3` | feat: add team/people section with HUD profile cards                             |
| `3b14d47` | style: improve events section UI and prize pool animation                        |
| `4c16ddb` | fix(outreach-events): change tag menu accordingly while changing the event types |

---

## Build Status

```bash
$ bun run build
✓ built successfully
dist/assets/index-*.css   ~94 kB
dist/assets/index-*.js   ~1145 kB
```

All builds passing without errors.

---

## Key Files Reference (Updated)

- Events Section: `apps/outreach/src/components/outreach/EventsSection.tsx`
- Prize Pool: `apps/outreach/src/components/outreach/PrizePoolSection.tsx`
- HUD Card: `apps/outreach/src/components/ui/hud-card.tsx`
- Profile Card: `apps/outreach/src/components/ui/hud-profile-card.tsx`
- People Section: `apps/outreach/src/components/outreach/PeopleSection.tsx`
- People Types: `apps/outreach/src/types/people.ts`
