# Research

Reading notes and reference material.

## Knowledge Graph Systems

Directly relevant to [[Project Ideas]] and the gardenX architecture.
See [[Index]] for the broader navigation context.

### Key Concepts

- **Nodes** represent entities (notes, concepts, people)
- **Edges** represent relationships (links, citations, backlinks)
- **Backlinks** are the key insight: a link from A → B implicitly creates B → A

### Prior Art

- Roam Research — block-level bidirectional linking
- Obsidian — file-level wiki-links, community plugin ecosystem
- Zettelkasten method — atomic notes + explicit cross-referencing

## Graph Layout Algorithms

D3's `forceSimulation` with `forceManyBody` + `forceLink` produces
readable layouts for graphs up to ~500 nodes without tuning.

Discussed with [[Meeting Notes]] — will revisit for larger corpora.

## Parser Design

Two-pass algorithm (documented and implemented in [[Project Ideas]]):

1. Pass 1 — scan every file, extract title / wiki-links / tags
2. Pass 2 — walk adjacency list to back-propagate links into target nodes

#research #cs180 #reference #algorithms
