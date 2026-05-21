import { useEffect, useRef, useCallback } from 'react'
import * as d3 from 'd3'
import type { GraphNode, GraphEdge, GraphData } from '../types'

const GC = {
  nodeFill:        '#061a11',
  nodeStroke:      '#166534',
  nodeHoverFill:   '#052e16',
  nodeHoverStroke: '#34d399',
  nodeSelFill:     '#052e16',
  nodeSelStroke:   '#86efac',
  edgeDefault:     '#1e293b',
  edgeHighlight:   '#166534',
}

interface Props {
  data: GraphData
  selectedId: string | null
  filterHits: Set<string> | null
  onSelect: (id: string) => void
}

export default function GraphVisualizer({ data, selectedId, filterHits, onSelect }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphEdge> | null>(null)
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null)
  const rootGRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null)
  const linkSelRef = useRef<d3.Selection<SVGLineElement, GraphEdge, SVGGElement, unknown> | null>(null)
  const nodeSelRef = useRef<d3.Selection<SVGGElement, GraphNode, SVGGElement, unknown> | null>(null)
  const onSelectRef = useRef(onSelect)
  const selectedIdRef = useRef(selectedId)

  useEffect(() => { onSelectRef.current = onSelect }, [onSelect])
  useEffect(() => { selectedIdRef.current = selectedId }, [selectedId])

  const nodeRadius = useCallback((d: GraphNode) => {
    return Math.max(5, Math.min(18, 5 + d.backlinkCount * 2))
  }, [])

  // ── Bootstrap SVG + simulation once ───────────────────────────────────
  useEffect(() => {
    const svg = d3.select(svgRef.current!)
    const { width, height } = svgRef.current!.getBoundingClientRect()

    svg.selectAll('*').remove()

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', e => rootG.attr('transform', e.transform))
    svg.call(zoom)
    zoomRef.current = zoom

    const rootG = svg.append('g')
    rootGRef.current = rootG

    rootG.append('g').attr('class', 'links')
    rootG.append('g').attr('class', 'nodes')

    const sim = d3.forceSimulation<GraphNode, GraphEdge>()
      .force('link', d3.forceLink<GraphNode, GraphEdge>().id(d => d.id).distance(90).strength(0.6))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide<GraphNode>().radius(d => nodeRadius(d) + 8))
    simulationRef.current = sim
  }, [nodeRadius])

  // ── Update graph data (nodes + edges) ─────────────────────────────────
  useEffect(() => {
    const sim = simulationRef.current
    const rootG = rootGRef.current
    if (!sim || !rootG) return

    const { nodes, edges } = data

    // Preserve existing positions
    const existingById = new Map<string, GraphNode>()
    ;(sim.nodes() as GraphNode[]).forEach(n => existingById.set(n.id, n))
    nodes.forEach(n => {
      const prev = existingById.get(n.id)
      if (prev) { n.x = prev.x; n.y = prev.y; n.vx = prev.vx; n.vy = prev.vy }
    })

    // Links
    const linkG = rootG.select<SVGGElement>('g.links')
    const linkSel = linkG.selectAll<SVGLineElement, GraphEdge>('line')
      .data(edges, (d: GraphEdge) => {
        const s = typeof d.source === 'string' ? d.source : d.source.id
        const t = typeof d.target === 'string' ? d.target : d.target.id
        return `${s}→${t}`
      })
    linkSel.enter().append('line')
      .attr('stroke', GC.edgeDefault)
      .attr('stroke-width', 1)
      .merge(linkSel)
    linkSel.exit().remove()
    linkSelRef.current = linkG.selectAll<SVGLineElement, GraphEdge>('line')

    // Nodes
    const nodeG = rootG.select<SVGGElement>('g.nodes')
    const nodeSel = nodeG.selectAll<SVGGElement, GraphNode>('g.node')
      .data(nodes, (d: GraphNode) => d.id)

    const entered = nodeSel.enter().append('g').attr('class', 'node')
    entered.append('circle')
    entered.append('text').attr('class', 'node-label').attr('dy', '0.35em')

    entered
      .style('opacity', 0)
      .transition().duration(300)
      .style('opacity', 1)

    entered.call(
      d3.drag<SVGGElement, GraphNode>()
        .on('start', (event, d) => {
          if (!event.active) sim.alphaTarget(0.3).restart()
          d.fx = d.x; d.fy = d.y
        })
        .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y })
        .on('end', (event, d) => {
          if (!event.active) sim.alphaTarget(0)
          d.fx = null; d.fy = null
        }),
    )

    entered
      .on('click', (_event, d) => onSelectRef.current(d.id))
      .on('mouseenter', function (_event, d) {
        const sel = selectedIdRef.current
        if (d.id === sel) return
        d3.select(this).select('circle')
          .attr('fill', GC.nodeHoverFill)
          .attr('stroke', GC.nodeHoverStroke)
      })
      .on('mouseleave', function (_event, d) {
        const sel = selectedIdRef.current
        if (d.id === sel) return
        d3.select(this).select('circle')
          .attr('fill', GC.nodeFill)
          .attr('stroke', GC.nodeStroke)
      })

    nodeSel.exit().remove()

    const merged = nodeG.selectAll<SVGGElement, GraphNode>('g.node')
    merged.select('circle')
      .attr('r', d => nodeRadius(d))
      .attr('fill', GC.nodeFill)
      .attr('stroke', GC.nodeStroke)
      .attr('stroke-width', 1.5)
      .style('cursor', 'pointer')
    merged.select('text')
      .text(d => d.title)
      .attr('x', d => nodeRadius(d) + 5)

    nodeSelRef.current = merged

    sim.nodes(nodes)
    ;(sim.force('link') as d3.ForceLink<GraphNode, GraphEdge>).links(edges)
    sim.alpha(0.3).restart()

    sim.on('tick', () => {
      linkSelRef.current
        ?.attr('x1', d => (typeof d.source === 'object' ? d.source.x ?? 0 : 0))
        .attr('y1', d => (typeof d.source === 'object' ? d.source.y ?? 0 : 0))
        .attr('x2', d => (typeof d.target === 'object' ? d.target.x ?? 0 : 0))
        .attr('y2', d => (typeof d.target === 'object' ? d.target.y ?? 0 : 0))

      nodeSelRef.current
        ?.attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0})`)
    })
  }, [data, nodeRadius])

  // ── Update selection highlight ─────────────────────────────────────────
  useEffect(() => {
    if (!nodeSelRef.current) return
    nodeSelRef.current.select('circle')
      .attr('fill', d => d.id === selectedId ? GC.nodeSelFill : GC.nodeFill)
      .attr('stroke', d => d.id === selectedId ? GC.nodeSelStroke : GC.nodeStroke)
      .attr('stroke-width', d => d.id === selectedId ? 2.5 : 1.5)

    if (!linkSelRef.current) return
    linkSelRef.current
      .attr('stroke', d => {
        const s = typeof d.source === 'object' ? d.source.id : d.source
        const t = typeof d.target === 'object' ? d.target.id : d.target
        return (s === selectedId || t === selectedId) ? GC.edgeHighlight : GC.edgeDefault
      })
      .attr('stroke-width', d => {
        const s = typeof d.source === 'object' ? d.source.id : d.source
        const t = typeof d.target === 'object' ? d.target.id : d.target
        return (s === selectedId || t === selectedId) ? 2 : 1
      })
  }, [selectedId])

  // ── Update filter dim ──────────────────────────────────────────────────
  useEffect(() => {
    if (!nodeSelRef.current) return
    nodeSelRef.current.style('opacity', d =>
      filterHits === null || filterHits.has(d.id) ? '1' : '0.2',
    )
  }, [filterHits])

  return (
    <svg
      ref={svgRef}
      className="w-full h-full"
      style={{ background: '#0B0D12' }}
    />
  )
}
