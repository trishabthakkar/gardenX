# Frontend

UI layer — React, TypeScript, and component conventions.

## Stack

- **React 19** with hooks only; no class components
- **TypeScript** strict mode; no `any` without a comment explaining why
- **Tailwind CSS v4** for styling; no CSS modules, no styled-components
- **Vite** for bundling; see [[Deployment]] for build pipeline

## Component Rules

1. One component per file. Filename matches the export name.
2. Props interfaces live in the same file, above the component.
3. No prop drilling past two levels — lift to context or co-locate state.
4. `useCallback` / `useMemo` only when a profiler shows it helps. See [[Performance]].

## State Management

Global state lives in `App.tsx` and flows down as props. We have not needed Redux or Zustand yet. Revisit if prop count exceeds ~8 per component.

Navigation history uses a `useReducer` — see [[Architecture]] for the reasoning.

## Design Tokens

All colours, spacing, and typography come from [[Design System]]. Do not hardcode hex values.

## Testing

- Unit: Vitest + Testing Library
- E2E: Playwright — see [[Testing]] for setup

## File Structure

```
src/
├── components/   — presentational, no fetching
├── hooks/        — shared stateful logic
├── types.ts      — shared TypeScript interfaces
└── App.tsx       — global state + data fetching
```

#frontend #react #typescript #ui
