# Performance

Profiling methodology, known bottlenecks, and optimization results.

## Principles

1. Measure before optimising. No speculative changes.
2. Fix the slowest thing first (Amdahl's Law).
3. Document what you tried and what the numbers were.

## Frontend

### Bundle Size

Current: **311 kB JS** (99 kB gzipped). Breakdown:

| Package | Size (gzip) |
|---|---|
| d3 | ~52 kB |
| react + react-dom | ~42 kB |
| marked | ~18 kB |
| app code | ~5 kB |

D3 is the biggest lever. If bundle size becomes a problem, import only the modules we use (`d3-force`, `d3-selection`, `d3-zoom`, `d3-drag`) rather than the full `d3` package.

### React Rendering

- `useCallback` / `useMemo` are used conservatively. Profile with React DevTools Profiler before adding more.
- D3 operates outside React's reconciler (imperative `useEffect`), so the graph doesn't trigger React re-renders on simulation ticks.

See [[Frontend]] for component architecture.

## Backend

### Slow Query Log

| Query | p99 | Fix |
|---|---|---|
| Full-text note search | 340ms | Add GIN index on `content` column |
| Graph edge join | 18ms | Acceptable |

Query analysis lives in [[Database]].

## Network

- All API responses are JSON. No unnecessary fields.
- `Cache-Control: no-store` on auth endpoints, `max-age=60` on graph data.
- [[Deployment]] Cloudflare caches static assets at the edge.

## Lighthouse Scores (current)

| Metric | Score |
|---|---|
| Performance | 94 |
| Accessibility | 88 |
| Best Practices | 100 |

#performance #optimisation #metrics #profiling
