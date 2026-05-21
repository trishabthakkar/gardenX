# Design System

Visual language — colour tokens, typography, spacing, and component guidelines.

## Colour Palette

### Base (Dark theme only for now)

| Token | Hex | Use |
|---|---|---|
| `bg-base` | `#0B0D12` | Page background |
| `bg-surface` | `#121620` | Cards, panels |
| `bg-elevated` | `#1a2030` | Hover states, dropdowns |
| `border` | `#1e293b` | All borders |

### Accent — Sage Emerald

| Token | Hex | Use |
|---|---|---|
| `accent-strong` | `#34d399` | Links, active states |
| `accent-mid` | `#166534` | Borders on accent elements |
| `accent-subtle` | `#052e16` | Hover backgrounds |

### Text

| Token | Hex | Use |
|---|---|---|
| `text-primary` | `#f1f5f9` | Headings |
| `text-secondary` | `#cbd5e1` | Body copy |
| `text-muted` | `#64748b` | Captions, metadata |
| `text-disabled` | `#334155` | Placeholder text |

## Typography

- **Sans**: Inter — UI chrome, body text
- **Mono**: JetBrains Mono — code, filenames, IDs

Scale: 11px (labels) → 12px (captions) → 14px (body) → 16px (subheadings) → 22px (headings)

## Spacing

4px base unit. All spacing is a multiple of 4. Tailwind's default scale maps cleanly (`p-1` = 4px, `p-2` = 8px, etc.).

## Component Conventions

- Buttons: `rounded-md`, never `rounded-full` except icon-only buttons
- Inputs: `border border-slate-700/60`, focus ring in accent colour
- Chips / tags: `rounded-full px-2 py-0.5 text-xs`

See [[Frontend]] for implementation details.

## Icons

We use inline SVGs (no icon font). Size: 14×14px for inline, 16×16px for standalone. Stroke width: 1.5–2.

#design #design-system #tokens #ui
