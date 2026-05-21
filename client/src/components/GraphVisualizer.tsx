import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import type { GraphNode, GraphEdge, GraphData } from '../types'

const GC = {
  textDefault:    '#4ade80',
  textHover:      '#86efac',
  textSelected:   '#ffffff',
  textMuted:      '#166534',
  edgeDefault:    '#1e293b',
  edgeHighlight:  '#166534',
  bgHover:        'rgba(5,46,22,0.5)',
  bgSelected:     'rgba(5,46,22,0.8)',
}

const FONT_BASE = 11
const FONT_MAX  = 15

interface Props {
  data: GraphData
  selectedId: string | null
  filterHits: Set<string> | null
  onSelect: (id: string) => void
}

export default function GraphVisualizer({ data, selectedId, filterHits, onSelect }: Props) {
  const svgRef       = useRef<SVGSVGElement>(null)
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphEdge> | null>(null)
  const rootGRef     = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null)
  const linkSelRef   = useRef<d3.Selection<SVGLineElement, GraphEdge, SVGGElement, unknown> | null>(null)
  const nodeSelRef   = useRef<d3.Selection<SVGGElement, GraphNode, SVGGElement, unknown> | null>(null)
  const onSelectRef  = useRef(onSelect)
  const selectedIdRef = useRef(selectedId)

  useEffect(() => { onSelectRef.current = onSelect }, [onSelect])
  useEffect(() => { selectedIdRef.current = selectedId }, [selectedId])

  const fontSize = (d: GraphNode) =>
    Math.round(FONT_BASE + Math.min(d.backlinkCount, 6) * ((FONT_MAX - FONT_BASE) / 6))

  // ── Bootstrap SVG + simulation once ───────────────────────────────────
  useEffect(() => {
    const svgEl = svgRef.current!
    const svg   = d3.select(svgEl)

    svg.selectAll('*').remove()

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on('zoom', e => rootG.attr('transform', e.transform))
    svg.call(zoom)

    const rootG = svg.append('g')
    rootGRef.current = rootG
    rootG.append('g').attr('class', 'links')
    rootG.append('g').attr('class', 'nodes')

    const sim = d3.forceSimulation<GraphNode, GraphEdge>()
      .force('link',    d3.forceLink<GraphNode, GraphEdge>().id(d => d.id).distance(120).strength(0.5))
      .force('charge',  d3.forceManyBody().strength(-300))
      .force('center',  d3.forceCenter(0, 0))
      .force('collide', d3.forceCollide<GraphNode>().radius(40))
    simulationRef.current = sim

    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        if (width > 0 && height > 0) {
          sim.force('center', d3.forceCenter(width / 2, height / 2))
          sim.alpha(0.5).restart()
        }
      }
    })
    ro.observe(svgEl)
    return () => ro.disconnect()
  }, [])

  // ── Update graph data ──────────────────────────────────────────────────
  useEffect(() => {
    const sim   = simulationRef.current
    const rootG = rootGRef.current
    if (!sim || !rootG) return

    const { nodes, edges } = data

    // Preserve positions of existing nodes
    const existing = new Map<string, GraphNode>()
    ;(sim.nodes() as GraphNode[]).forEach(n => existing.set(n.id, n))
    nodes.forEach(n => {
      const prev = existing.get(n.id)
      if (prev) { n.x = prev.x; n.y = prev.y; n.vx = prev.vx; n.vy = prev.vy }
    })

    // ── Edges ────────────────────────────────────────────────────────────
    const linkG   = rootG.select<SVGGElement>('g.links')
    const linkSel = linkG.selectAll<SVGLineElement, GraphEdge>('line')
      .data(edges, (d: GraphEdge) => {
        const s = typeof d.source === 'string' ? d.source : d.source.id
        const t = typeof d.target === 'string' ? d.target : d.target.id
        return `${s}→${t}`
      })
    linkSel.enter().append('line').merge(linkSel)
      .attr('stroke', GC.edgeDefault)
      .attr('stroke-width', 1)
    linkSel.exit().remove()
    linkSelRef.current = linkG.selectAll<SVGLineElement, GraphEdge>('line')

    // ── Nodes ────────────────────────────────────────────────────────────
    const nodeG   = rootG.select<SVGGElement>('g.nodes')
    const nodeSel = nodeG.selectAll<SVGGElement, GraphNode>('g.node')
      .data(nodes, (d: GraphNode) => d.id)

    const entered = nodeSel.enter().append('g').attr('class', 'node').style('cursor', 'pointer')

    // background pill (for hover highlight and hit area)
    entered.append('rect')
      .attr('rx', 3)
      .attr('ry', 3)
      .attr('fill', 'transparent')

    // link text
    entered.append('text')
      .attr('dy', '0.35em')
      .attr('text-anchor', 'middle')

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
        .on('end',  (event, d) => {
          if (!event.active) sim.alphaTarget(0)
          d.fx = null; d.fy = null
        }),
    )

    entered
      .on('click', (_e, d) => onSelectRef.current(d.id))
      .on('mouseenter', function (_e, d) {
        if (d.id === selectedIdRef.current) return
        d3.select(this).select('text').attr('fill', GC.textHover)
        d3.select(this).select('rect').attr('fill', GC.bgHover)
      })
      .on('mouseleave', function (_e, d) {
        if (d.id === selectedIdRef.current) return
        d3.select(this).select('text').attr('fill', GC.textDefault)
        d3.select(this).select('rect').attr('fill', 'transparent')
      })

    nodeSel.exit().remove()

    // Update all nodes (entered + existing)
    const merged = nodeG.selectAll<SVGGElement, GraphNode>('g.node')

    merged.select<SVGTextElement>('text')
      .text(d => d.title)
      .attr('font-size', d => `${fontSize(d)}px`)
      .attr('font-family', 'Inter, ui-sans-serif, sans-serif')
      .attr('fill', GC.textDefault)
      .attr('text-decoration', 'underline')
      .attr('text-underline-offset', '2px')
      .attr('text-decoration-color', GC.textMuted)

    // Size the background rect to match text bounds after render
    merged.each(function(d) {
      const g    = d3.select(this)
      const text = g.select<SVGTextElement>('text').node()
      if (!text) return
      const bbox = text.getBBox()
      const pad  = { x: 6, y: 3 }
      g.select('rect')
        .attr('x',      bbox.x - pad.x)
        .attr('y',      bbox.y - pad.y)
        .attr('width',  bbox.width  + pad.x * 2)
        .attr('height', bbox.height + pad.y * 2)
      // Store half-width for edge endpoint offset
      d.fx === undefined && (d as GraphNode & { _hw?: number })
      ;(d as GraphNode & { _hw?: number })._hw = bbox.width / 2
    })

    nodeSelRef.current = merged

    sim.nodes(nodes)
    ;(sim.force('link') as d3.ForceLink<GraphNode, GraphEdge>).links(edges)
    sim.alpha(0.3).restart()

    sim.on('tick', () => {
      linkSelRef.current
        ?.attr('x1', d => (typeof d.source === 'object' ? d.source.x ?? 0 : 0))
        .attr('y1',  d => (typeof d.source === 'object' ? d.source.y ?? 0 : 0))
        .attr('x2',  d => (typeof d.target === 'object' ? d.target.x ?? 0 : 0))
        .attr('y2',  d => (typeof d.target === 'object' ? d.target.y ?? 0 : 0))

      nodeSelRef.current
        ?.attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0})`)
    })
  }, [data])

  // ── Selection highlight ────────────────────────────────────────────────
  useEffect(() => {
    if (!nodeSelRef.current) return
    nodeSelRef.current.select('text')
      .attr('fill', d => d.id === selectedId ? GC.textSelected : GC.textDefault)
      .attr('font-weight', d => d.id === selectedId ? '600' : '400')
    nodeSelRef.current.select('rect')
      .attr('fill', d => d.id === selectedId ? GC.bgSelected : 'transparent')

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
        return (s === selectedId || t === selectedId) ? 1.5 : 1
      })
  }, [selectedId])

  // ── Filter dim ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!nodeSelRef.current) return
    nodeSelRef.current.style('opacity', d =>
      filterHits === null || filterHits.has(d.id) ? '1' : '0.15',
    )
  }, [filterHits])

  return (
    <svg ref={svgRef} className="w-full h-full" style={{ background: '#0B0D12' }} />
  )
}
