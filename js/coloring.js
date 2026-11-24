import { adjacencyFor } from './graph.js';

function assignFirstAvailable(vertex, colors, adjacency) {
  const used = new Set([...adjacency.get(vertex)].map(n => colors.get(n)).filter(c => c !== undefined));
  let color = 0; while (used.has(color)) color++;
  colors.set(vertex, color);
}
export function greedyColoring(graph) {
  const adjacency = adjacencyFor(graph), colors = new Map();
  for (const vertex of graph.vertices) assignFirstAvailable(vertex, colors, adjacency);
  return colors;
}
export function welshPowellColoring(graph) {
  const adjacency = adjacencyFor(graph), colors = new Map();
  const order = [...graph.vertices].sort((a,b) => adjacency.get(b).size - adjacency.get(a).size || String(a).localeCompare(String(b)));
  for (const vertex of order) assignFirstAvailable(vertex, colors, adjacency);
  return colors;
}
export function dsaturColoring(graph) {
  const adjacency = adjacencyFor(graph), colors = new Map();
  while (colors.size < graph.vertices.length) {
    const remaining = graph.vertices.filter(v => !colors.has(v));
    remaining.sort((a,b) => {
      const saturation = v => new Set([...adjacency.get(v)].map(n => colors.get(n)).filter(c => c !== undefined)).size;
      return saturation(b) - saturation(a) || adjacency.get(b).size - adjacency.get(a).size || String(a).localeCompare(String(b));
    });
    assignFirstAvailable(remaining[0], colors, adjacency);
  }
  return colors;
}
export const algorithms = {
  greedy: { label:'Greedy Coloring', run:greedyColoring },
  'welsh-powell': { label:'Welsh–Powell', run:welshPowellColoring },
  dsatur: { label:'DSATUR', run:dsaturColoring }
};
export function colorCount(colors) { return colors.size ? Math.max(...colors.values()) + 1 : 0; }
export function colorClasses(colors) {
  const classes = new Map();
  for (const [vertex,color] of colors) { if (!classes.has(color)) classes.set(color,[]); classes.get(color).push(vertex); }
  return new Map([...classes].sort((a,b) => a[0]-b[0]));
}
export function verifyColoring(graph, colors) {
  const conflicts = graph.edges.filter(([a,b]) => colors.get(a) === colors.get(b));
  return { valid: conflicts.length === 0 && graph.vertices.every(v => colors.has(v)), conflicts };
}
