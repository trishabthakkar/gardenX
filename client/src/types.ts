export interface GraphNode {
  id: string;
  title: string;
  tags: string[];
  backlinkCount: number;
  // D3 simulation injects these at runtime
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface GraphEdge {
  source: string | GraphNode;
  target: string | GraphNode;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface Note {
  filename: string;
  title: string;
  tags: string[];
  links: string[];
  backlinks: string[];
  raw: string;
}

export interface SearchResult {
  filename: string;
  title: string;
  tags: string[];
  matchIn: string[];
  excerpt: string | null;
}

export interface SaveNoteRequest {
  content: string;
}

export interface SaveNoteResponse {
  ok: boolean;
  filename: string;
  title: string;
}
