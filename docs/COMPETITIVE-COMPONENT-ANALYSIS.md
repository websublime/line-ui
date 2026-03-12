# line://ui — Competitive Component Analysis

**Date:** 2026-03-12
**Purpose:** Identify gaps in line://ui's catalogue by comparing against leading UI libraries.

---

## Libraries Compared

| Library | Type | Framework | Components |
|---------|------|-----------|------------|
| **line://ui** | Web Components (Lit 3+, Zag.js) | Framework-agnostic | 127 planned |
| **Shoelace** | Web Components (Lit) | Framework-agnostic | ~40 shipped |
| **Radix Primitives** | React-only headless | React | ~32 + 3 preview |
| **shadcn/ui** | Copy-paste (Radix-based) | React + Tailwind | ~58 |
| **Ark UI** | Headless (Zag.js) | React/Vue/Solid/Svelte | ~45 + utilities |

---

## Component-by-Component Matrix

✅ = has it  |  ⚡ = similar/partial  |  ❌ = missing  |  🔮 = preview/experimental

### Primitives & Layout

| Component | line://ui | Shoelace | Radix | shadcn/ui | Ark UI |
|-----------|-----------|----------|-------|-----------|--------|
| Button | ✅ | ✅ | ❌ | ✅ | ❌ |
| IconButton | ✅ | ✅ | ❌ | ❌ | ❌ |
| ButtonGroup | ✅ | ✅ | ❌ | ✅ | ❌ |
| SplitButton | ✅ | ❌ | ❌ | ❌ | ❌ |
| Badge | ✅ | ✅ | ❌ | ✅ | ❌ |
| Avatar | ✅ | ✅ | ✅ | ✅ | ✅ |
| AvatarGroup | ✅ | ❌ | ❌ | ❌ | ❌ |
| Separator | ✅ | ✅ (Divider) | ✅ | ✅ | ❌ |
| Icon | ✅ | ✅ | ⚡ (Accessible Icon) | ❌ | ❌ |
| Kbd / Shortcut | ✅ | ❌ | ❌ | ✅ | ❌ |
| Skeleton | ✅ | ✅ | ❌ | ✅ | ❌ |
| Portal | ✅ | ❌ | ✅ | ❌ | ❌ |
| Visually Hidden | ✅ | ❌ | ✅ | ❌ | ❌ |
| Presence | ✅ | ❌ | ❌ | ❌ | ✅ |
| Aspect Ratio | ✅ | ❌ | ✅ | ✅ | ❌ |
| Stack | ✅ | ❌ | ❌ | ❌ | ❌ |
| Grid | ✅ | ❌ | ❌ | ❌ | ❌ |
| Center | ✅ | ❌ | ❌ | ❌ | ❌ |
| Alert / Callout | ✅ | ✅ | ❌ | ✅ | ❌ |
| Chip / Tag | ✅ | ✅ (Tag) | ❌ | ❌ | ❌ |
| Spinner | ❌ | ✅ | ❌ | ✅ | ❌ |
| Typography | ❌ | ❌ | ❌ | ✅ | ❌ |
| Empty State | ✅ | ❌ | ❌ | ✅ | ❌ |
| Label (standalone) | ❌ (inside Field) | ❌ | ✅ | ✅ | ❌ |

### Forms — Essential

| Component | line://ui | Shoelace | Radix | shadcn/ui | Ark UI |
|-----------|-----------|----------|-------|-----------|--------|
| Input | ✅ | ✅ | ❌ | ✅ | ❌ |
| PasswordInput | ✅ | ❌ | 🔮 | ❌ | ✅ |
| SearchInput | ✅ | ❌ | ❌ | ❌ | ❌ |
| DateInput | ✅ | ❌ | ❌ | ❌ | ❌ |
| Textarea | ✅ | ✅ | ❌ | ✅ | ❌ |
| Field | ✅ | ❌ | 🔮 | ✅ | ✅ |
| Fieldset | ✅ | ❌ | ❌ | ❌ | ✅ |
| Checkbox | ✅ | ✅ | ✅ | ✅ | ✅ |
| Radio Group | ✅ | ✅ | ✅ | ✅ | ✅ |
| Switch | ✅ | ✅ | ✅ | ✅ | ✅ |
| Select | ✅ | ✅ | ✅ | ✅ | ✅ |
| Toggle Group | ✅ | ❌ | ✅ | ✅ | ✅ |
| Slider | ✅ | ✅ (Range) | ✅ | ✅ | ✅ |
| Number Input | ✅ | ❌ | ❌ | ❌ | ✅ |
| Input Group | ❌ (via slots) | ❌ | ❌ | ✅ | ❌ |
| Native Select | ❌ | ❌ | ❌ | ✅ | ❌ |
| Editable | ❌ | ❌ | ❌ | ❌ | ✅ |

### Overlays & Feedback

| Component | line://ui | Shoelace | Radix | shadcn/ui | Ark UI |
|-----------|-----------|----------|-------|-----------|--------|
| Dialog | ✅ | ✅ | ✅ | ✅ | ✅ |
| Alert Dialog | ✅ | ❌ | ✅ | ✅ | ❌ |
| Sheet | ✅ | ❌ | ❌ | ✅ | ❌ |
| Drawer | ✅ | ✅ | ❌ | ✅ | ❌ |
| Popover | ✅ | ❌ | ✅ | ✅ | ✅ |
| Tooltip | ✅ | ✅ | ✅ | ✅ | ✅ |
| Hover Card | ✅ | ❌ | ✅ | ✅ | ✅ |
| Toast | ✅ | ❌ | ✅ | ✅ (Sonner) | ✅ |

### Navigation & Disclosure

| Component | line://ui | Shoelace | Radix | shadcn/ui | Ark UI |
|-----------|-----------|----------|-------|-----------|--------|
| Tabs | ✅ | ✅ | ✅ | ✅ | ✅ |
| Accordion | ✅ | ✅ (Details) | ✅ | ✅ | ✅ |
| Collapsible | ✅ | ❌ | ✅ | ✅ | ✅ |
| Menu / Context Menu | ✅ | ✅ | ✅ | ✅ | ✅ |
| Navigation Menu | ✅ | ❌ | ✅ | ✅ | ❌ |
| Menubar | ❌ | ❌ | ✅ | ✅ | ❌ |
| Breadcrumb | ✅ | ✅ | ❌ | ✅ | ❌ |
| Breadcrumb Trail | ✅ | ❌ | ❌ | ❌ | ❌ |
| Pagination | ✅ | ❌ | ❌ | ✅ | ✅ |
| Steps / Stepper | ✅ | ❌ | ❌ | ❌ | ✅ |
| Sidebar | ✅ | ❌ | ❌ | ✅ | ❌ |
| Toolbar | ❌ (Header/Toolbar) | ❌ | ✅ | ❌ | ❌ |

### Forms — Advanced

| Component | line://ui | Shoelace | Radix | shadcn/ui | Ark UI |
|-----------|-----------|----------|-------|-----------|--------|
| Combobox | ✅ | ❌ | ❌ | ✅ (Command) | ✅ |
| Date Picker | ✅ | ❌ | ❌ | ✅ | ✅ |
| Date Range Picker | ✅ | ❌ | ❌ | ❌ | ⚡ (mode) |
| Time Picker | ✅ | ❌ | ❌ | ❌ | ❌ |
| Color Picker | ✅ | ✅ | ❌ | ❌ | ✅ |
| Pin Input / OTP | ✅ | ❌ | 🔮 | ✅ | ✅ |
| Rating | ✅ | ✅ | ❌ | ❌ | ✅ |
| Range Slider | ✅ | ❌ | ❌ | ❌ | ❌ |
| File Upload | ✅ | ❌ | ❌ | ❌ | ✅ |
| Signature Pad | ✅ | ❌ | ❌ | ❌ | ✅ |
| Tag Input | ✅ | ❌ | ❌ | ❌ | ✅ |
| Mention Input | ✅ | ❌ | ❌ | ❌ | ❌ |
| Search Field | ✅ | ❌ | ❌ | ❌ | ❌ |
| Wizard | ✅ | ❌ | ❌ | ❌ | ❌ |

### Data Display

| Component | line://ui | Shoelace | Radix | shadcn/ui | Ark UI |
|-----------|-----------|----------|-------|-----------|--------|
| Table | ✅ | ❌ | ❌ | ✅ (Data Table) | ❌ |
| Card | ✅ | ✅ | ❌ | ✅ | ❌ |
| Progress | ✅ | ✅ | ✅ | ✅ | ❌ |
| Progress Ring | ✅ | ✅ | ❌ | ❌ | ❌ |
| Scroll Area | ✅ | ❌ | ✅ | ✅ | ✅ |
| Carousel | ✅ | ❌ | ❌ | ✅ | ✅ |
| Clipboard | ✅ | ❌ | ❌ | ❌ | ✅ |
| QR Code | ✅ | ✅ | ❌ | ❌ | ✅ |
| Timer | ✅ | ❌ | ❌ | ❌ | ✅ |
| Tree View | ✅ | ✅ | ❌ | ❌ | 🔮 |
| Chart | ❌ (Sparkline) | ❌ | ❌ | ✅ | ❌ |
| Resizable | ✅ (Splitter) | ✅ (Split Panel) | ❌ | ✅ | 🔮 |
| Image Comparer | ✅ | ✅ | ❌ | ❌ | ❌ |
| Listbox | ❌ (List View) | ❌ | ❌ | ❌ | ✅ |
| Marquee | ✅ | ❌ | ❌ | ❌ | ✅ |

### Unique to line://ui (not in any competitor)

| Component | Category |
|-----------|----------|
| SplitButton | Primitives |
| AvatarGroup | Primitives |
| SearchInput | Essential Forms |
| DateInput | Essential Forms |
| Breadcrumb Trail | Navigation |
| Command Palette | Desktop-Inspired |
| Spotlight | Desktop-Inspired |
| Status Bar | Desktop-Inspired |
| Activity Bar | Desktop-Inspired |
| Notification Center | Desktop-Inspired |
| Properties Panel | Desktop-Inspired |
| Minimap | Desktop-Inspired |
| Master-Detail | Desktop-Inspired |
| List View | Desktop-Inspired |
| Dock | Desktop-Inspired |
| Kanban Board | Innovative |
| Timeline | Innovative |
| Data Grid | Innovative |
| Infinite Scroll | Innovative |
| Spotlight Card | Innovative |
| Sparkline | Innovative |
| Flip Card | Innovative |
| Diff Viewer | Innovative |
| Wheel Picker | Innovative |
| All 17 Real-World/Domain components | Domain |

**line://ui has 60+ components that no competitor offers.** This is the primary differentiator — not just headless web components, but a catalogue that goes far beyond form controls into desktop-app patterns, innovative UI, and real-world domain components.

---

## Gaps Found — Components in competitors but NOT in line://ui

### Critical Gaps (should consider adding)

| Component | Found in | What it does | Priority |
|-----------|----------|-------------|----------|
| **Editable** | Ark UI | Click-to-edit inline text. Click on text → turns into input → blur saves. Common pattern for settings, profile names, table cells. | High — common pattern, no equivalent in catalogue |
| **Spinner / Loading** | Shoelace, shadcn | Dedicated loading indicator component. line://ui has `loading` state on Button but no standalone spinner. Needed for page loaders, skeleton alternatives, async feedback. | High — fundamental visual feedback |
| **Menubar** | Radix, shadcn | Horizontal app-style menu bar (File, Edit, View...). Different from NavigationMenu (which is for site nav). For desktop-inspired apps, this is essential. | Medium — aligns with Desktop-Inspired category |

### Worth Considering

| Component | Found in | What it does | Priority |
|-----------|----------|-------------|----------|
| **Image Cropper** | Ark UI (preview) | Visual tool for cropping images. Interactive crop area with aspect ratio control. | Low — niche but useful for upload flows |
| **Listbox** | Ark UI | Standalone selectable list (not dropdown). Keyboard navigable, single/multi select. Similar to line://ui's List View but focused on selection, not layout. | Low — List View covers most cases |
| **Format utilities** | Ark UI | FormatByte, FormatTime, FormatRelativeTime, FormatNumber — presentation utilities for common formatting. Not components per se, but useful tools. | Low — nice-to-have utilities, not components |
| **Locale Provider** | Ark UI | i18n utilities — number/date formatting based on locale, filtering. | Low — nice-to-have utility |
| **Swap** | Ark UI (new) | Animation utility for swapping content (icon transitions, text changes). | Low — CSS can handle most cases |
| **JSON Tree View** | Ark UI (preview) | Developer-oriented JSON visualization. | Low — niche, aligns with Terminal/Console |

### Not Gaps (design decisions)

| Component | Found in | Why NOT a gap |
|-----------|----------|---------------|
| **Label** (standalone) | Radix, shadcn | line://ui handles this inside Field. Standalone Label adds complexity without benefit — the Field orchestrates label↔input connection. |
| **Input Group** | shadcn | line://ui handles this via prefix/suffix slots on Input. Same functionality, better API. |
| **Native Select** | shadcn | line://ui's Select is headless and supports native fallback via progressive enhancement. A separate Native Select component adds confusion. |
| **Typography** | shadcn | These are styled text components (Heading, Paragraph, etc.). In a headless library, the consumer styles text directly. Not a component. |
| **Chart** | shadcn | shadcn wraps Recharts. This is a styled integration, not a headless primitive. line://ui has Sparkline for inline charts; full charting is out of scope. |
| **Direction Provider** | Radix, shadcn | line://ui handles this as a mixin in LineElement base class. Not a separate component. |
| **Toolbar** | Radix | line://ui has Header/Toolbar in Layout. Same concept, different naming. |
| **Segment Group** | Ark UI | line://ui has Segmented Control. Same component, different name. |
| **Toggle** (standalone) | Radix, shadcn, Ark | line://ui's Button with `pressed` state covers this. ToggleGroup with single item also works. |

---

## Recommendation

### Add to catalogue (3 new components)

| Component | Tier | Proposed Phase | Justification |
|-----------|------|---------------|---------------|
| **Editable** | Custom | Phase 2 (Essential Forms) | Common inline-edit pattern. Custom machine: reading → editing → saving. Used in tables, settings, profile fields. Ark UI validates demand. |
| **Spinner** | Static | Phase 1 (Primitives) | Fundamental loading feedback. CSS-only animation (no machine needed). Parts: root. Props: size, speed. Consumer styles the visual. |
| **Menubar** | Pre-built | Phase 3 (Navigation) | Desktop app menus. `@zag-js/menu` supports menubar mode. Essential for Desktop-Inspired category credibility. |

### Consider as utilities (not components)

| Utility | Proposed Phase |
|---------|---------------|
| Format (byte, time, number, relative time) | Phase 5+ or post-1.0 |
| Locale Provider | Phase 5+ or post-1.0 |

### Catalogue update impact

- Current: **127 components**
- After adding Editable, Spinner, Menubar: **130 components**
- Phase 1: 19 → **20** (+ Spinner)
- Phase 2: 14 → **15** (+ Editable)
- Phase 3: 15 → **16** (+ Menubar)

---

## Key Takeaway

line://ui's catalogue is already **significantly larger** than any single competitor. The gaps that exist are minor (Editable, Spinner, Menubar) and easily addressable. The real differentiator is the 60+ components in Desktop-Inspired, Innovative, and Real-World categories that **no competitor offers at all**. This is where line://ui's value proposition lives — not competing on the same 30 form controls everyone has, but extending into territory nobody has covered with headless web components.
