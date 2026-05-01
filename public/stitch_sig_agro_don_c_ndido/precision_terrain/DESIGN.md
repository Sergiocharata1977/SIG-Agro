---
name: Precision Terrain
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#414844'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#717973'
  outline-variant: '#c1c8c2'
  surface-tint: '#3f6653'
  primary: '#012d1d'
  on-primary: '#ffffff'
  primary-container: '#1b4332'
  on-primary-container: '#86af99'
  inverse-primary: '#a5d0b9'
  secondary: '#446900'
  on-secondary: '#ffffff'
  secondary-container: '#b2f746'
  on-secondary-container: '#496f00'
  tertiary: '#1e2539'
  on-tertiary: '#ffffff'
  tertiary-container: '#333b50'
  on-tertiary-container: '#9ea5be'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c1ecd4'
  primary-fixed-dim: '#a5d0b9'
  on-primary-fixed: '#002114'
  on-primary-fixed-variant: '#274e3d'
  secondary-fixed: '#b2f746'
  secondary-fixed-dim: '#98da27'
  on-secondary-fixed: '#121f00'
  on-secondary-fixed-variant: '#334f00'
  tertiary-fixed: '#dae2fd'
  tertiary-fixed-dim: '#bec6e0'
  on-tertiary-fixed: '#131b2e'
  on-tertiary-fixed-variant: '#3f465c'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  h1:
    fontFamily: Manrope
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.2'
  h2:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.25'
  h3:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
  metric:
    fontFamily: Manrope
    fontSize: 28px
    fontWeight: '700'
    lineHeight: '1'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 16px
  md: 24px
  lg: 32px
  xl: 48px
  gutter: 20px
  margin: 24px
---

## Brand & Style

The design system is engineered to project **Precision, Reliability, and Technological Sophistication**. It targets the modern agricultural producer who operates at the intersection of traditional land stewardship and cutting-edge data science. 

The visual style is **Corporate Modern with a Data-Driven edge**. It avoids the rustic cliches of agriculture in favor of a clean, high-performance aesthetic found in aerospace or fintech. This approach builds trust through clarity and technical excellence. The interface emphasizes functional density, ensuring that complex GIS data is accessible without overwhelming the user.

## Colors

The color palette of this design system balances the organic and the digital. 

- **Primary Forest Green**: Used for core branding, primary actions, and navigational anchors. It establishes the "Agro" foundation.
- **Vibrant Lime**: Used sparingly for "Tech-GIS" interactions—data overlays, active map states, and success indicators.
- **Deep Navy Blue**: Reserved for high-contrast typography and data visualization to ensure professional readability.
- **Slate & Off-White**: Provide a clean, airy canvas that allows geographic maps and satellite imagery to remain the focal point.
- **Amber**: Utilized strictly for alerts, warnings, and critical weather or crop health notifications.

## Typography

This design system utilizes a dual-font strategy to differentiate brand presence from functional data.

- **Manrope (Headings & Metrics)**: Used for bold titles and large numerical data (yields, area measurements). Its geometric yet friendly character provides a premium feel.
- **Inter (Body & Interface)**: Used for all UI controls, data tables, and descriptive text. Its high x-height and neutral personality ensure maximum legibility in dense dashboards.

Typography should maintain a high contrast ratio against backgrounds to ensure accessibility in outdoor high-glare environments often encountered in field management.

## Layout & Spacing

The design system employs a **12-column fluid grid** for dashboard views, allowing content to adapt from tablet to wide-screen monitors. 

- **Density**: Use a "tight but breathable" approach. Data-heavy tables and property lists use `8px` (xs) spacing to maximize information density, while marketing or high-level overview sections use `32px` (lg) to feel more premium and spacious.
- **GIS Layouts**: Maps should typically occupy a full-screen or large-module container with "floating" UI panels anchored to the edges using `md` (24px) margins.

## Elevation & Depth

Hierarchy is established through **Tonal Layering** and **Ambient Shadows**. 

- **Level 0**: The Off-White background (#F8FAFC).
- **Level 1**: Primary cards and content blocks use White surfaces with a `1px` stroke in Light Gray (#E2E8F0) and a very soft, diffused shadow (0px 4px 12px rgba(15, 23, 42, 0.05)).
- **Level 2**: Modals, dropdowns, and floating GIS toolbars use a more pronounced shadow to indicate interactivity and separation from the map layer.
- **Glassmorphism**: Use backdrop blurs (12px) on map-overlay menus to maintain visual context of the field while interacting with controls.

## Shapes

The design system utilizes **Rounded (0.5rem)** corners as the default for most components. This level of roundedness softens the technical nature of the GIS data, making the platform feel approachable and modern.

- **Standard Buttons/Inputs**: `8px` (0.5rem) radius.
- **Large Cards**: `16px` (1rem) radius.
- **Search Bars/Pill Tags**: Full rounding (pill-shaped) to distinguish them as interactive global elements.
- **GIS Markers**: Hexagonal or circular shapes to differentiate from standard rectangular UI components.

## Components

### Buttons & Inputs
- **Primary Action**: Solid Forest Green background with White text. Bold and authoritative.
- **Secondary Action**: Ghost buttons with a 1px Forest Green border.
- **GIS Tools**: Square buttons with Lime Green icons when active, providing high visual feedback on the map.
- **Form Fields**: Clean, white backgrounds with thin Slate borders that darken on focus.

### Cards & Data Visualization
- **Insight Cards**: Use a "Border-Top" accent in Lime or Forest Green to categorize data types (e.g., Green for health, Blue for irrigation).
- **KPI Metrics**: Large Manrope bold text paired with small trend micro-charts.

### Icons
- **Style**: Use thin-stroke, modern line icons (2px stroke width).
- **Thematic**: Custom icons for satellite connectivity, soil moisture, crop health, and AI-driven insights (using Gemini-inspired sparkles for "smart" features).

### Selection Controls
- **Toggle Switches**: Use the vibrant Lime for the 'On' state to symbolize energy and activity.
- **Checkboxes**: Squared with a 4px corner radius for a technical look.