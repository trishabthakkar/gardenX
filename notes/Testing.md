# Testing

Testing strategy, tooling, and coverage targets.

## Pyramid

```
         /‾‾‾‾‾‾‾\
        /   E2E    \       ~20 tests (Playwright)
       /‾‾‾‾‾‾‾‾‾‾‾\
      / Integration  \     ~80 tests (Vitest + real DB)
     /‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾\
    /      Unit        \   ~300 tests (Vitest)
   /‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾\
```

## Unit Tests

- **Tool**: Vitest
- **Where**: `*.test.ts` co-located with source files
- **What**: Pure functions — parser, validators, formatters
- **Not**: React components (use integration tests for those), anything that hits the network

```ts
// example
import { parseNote } from './parser'

test('extracts wiki-links', () => {
  const note = parseNote('test.md', '# Title\n\n[[Other Note]]')
  expect(note.links).toEqual(['Other Note'])
})
```

## Integration Tests

- **Tool**: Vitest + `pg` connected to a test [[Database]] (Docker Compose)
- **What**: API routes end-to-end through the [[Backend]] stack
- **Setup/teardown**: Each test runs in a transaction that rolls back on completion

## E2E Tests

- **Tool**: Playwright
- **What**: Critical user journeys only
  1. Login → view graph → click node → read note
  2. Edit note → save → verify graph updates
  3. Search → select result → navigate back

Runs in CI on every PR. See [[Deployment]].

## Coverage

Tracked by Vitest. Target: **80% line coverage** on `server/` and `src/`. Coverage is a floor, not a goal — don't write tests just to hit the number.

## What We Don't Test

- D3 simulation physics
- Third-party library internals
- [[Authentication]] provider SDK behaviour

#testing #vitest #playwright #quality
