# Style Guide

This style guide is based on the provided application interface design. It defines the visual language, color palette, typography, and component patterns for the Todo List application.

## 1. Color Palette

### 1.1 Core Colors
| Color | Hex Code | Usage |
| :--- | :--- | :--- |
| **Primary Blue** | `#007BFF` | Primary actions, "Connect" button, Active date indicator, FAB. |
| **Background White** | `#FFFFFF` | Main application background, Sidebar background. |
| **Light Gray** | `#F8F9FA` | Hover states, secondary backgrounds. |
| **Border Gray** | `#EDEDED` | Grid lines, sidebar separators. |
| **Active Background** | `#E7F1FF` | Selected navigation items or highlights. |

### 1.2 Text Colors
| Color | Hex Code | Usage |
| :--- | :--- | :--- |
| **Primary Text** | `#212529` | Main headers, navigation titles, task names. |
| **Secondary Text** | `#6C757D` | Secondary info (plan type, date labels, counts). |
| **Muted Text** | `#ADB5BD` | Time markers (8:00 AM), inactive states. |

### 1.3 Semantic Colors
| Color | Hex Code | Usage |
| :--- | :--- | :--- |
| **Accent/Task** | `#FF4D4F` | High priority indicators, task progress lines. |
| **Gold/Premium** | `#D4AF37` | Premium feature icons or labels. |

## 2. Typography

- **Font Family:** Clean Sans-serif (e.g., "Inter", "Segoe UI", "Roboto").
- **Scale:**
    - **H1 (Name/Header):** 18px, Semi-bold.
    - **H2 (Month/Year):** 20px, Bold.
    - **Body (Nav/Task):** 14px, Regular/Medium.
    - **Small (Labels/Time):** 12px, Regular.

## 3. Iconography

- **Style:** Thin/Medium weight outline icons.
- **Sizes:**
    - Navigation: 20x20px.
    - Top bar icons: 24x24px.
- **Common Icons:**
    - Home/My Day: Sun outline.
    - Calendar: Calendar outline.
    - Lists: List/Bullet outline.
    - Tags: Tag outline.
    - Premium: Crown outline.

## 4. Components

### 4.1 Buttons
- **Primary Button (Pill):** Fully rounded (border-radius: 20px), Primary Blue background, White text.
- **Secondary Button (Outline):** Thin gray border, transparent background, Primary Text.
- **FAB (Floating Action Button):** Circle button, Primary Blue, "+" icon with "Create" text.

### 4.2 Navigation Items
- **Sidebar Items:**
    - Icon + Label + Optional Count badge.
    - Hover state: Light Gray background.
    - Active state: Primary Blue text or slight blue tint background.
- **Count Badges:** Small gray circle (`#E9ECEF`), centered dark gray text, 12px font.

### 4.3 Calendar View
- **Grid:** Very thin horizontal and vertical lines (`#EDEDED`).
- **Time Slots:** Left-aligned labels, aligned with horizontal lines.
- **Current Day Indicator:** Blue circle/badge on the day header.
- **Task Indicator:** Rounded horizontal bar with a small dot at the start.

## 5. Layout & Spacing

- **Sidebar Width:** ~260px.
- **Content Padding:** Generous whitespace (24px - 32px) for a clean, modern feel.
- **Vertical Rhythm:** Consistent spacing between sidebar sections (My Day, My Lists, Tags).

## 6. Visual Effects
- **Shadows:** Very subtle drop shadows for floating elements (like task popups or the character card).
- **Border Radius:** 
    - Standard cards: 12px - 16px.
    - Buttons: 20px+ (Pill shape).
    - Sidebar characters/promos: Highly rounded.
