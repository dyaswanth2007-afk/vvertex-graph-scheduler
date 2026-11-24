/** Build an undirected simple graph from student registrations. */
export function buildConflictGraph(registrations) {
  const vertices = [...new Set(registrations.flatMap(r => r.subjects))].sort();
  const edges = new Set();
  for (const registration of registrations) {
    const subjects = [...new Set(registration.subjects)];
    for (let i = 0; i < subjects.length; i++) for (let j = i + 1; j < subjects.length; j++) {
      const [a, b] = [subjects[i], subjects[j]].sort();
      edges.add(`${a}\u0000${b}`);
    }
  }
  return { vertices, edges: [...edges].map(key => key.split('\u0000')) };
}

/** Normalize/validate a general graph. Edge inputs are [label, label] pairs. */
export function validateGraph(vertices, edges) {
  const errors = [];
  if (!Array.isArray(vertices) || vertices.length < 1 || vertices.length > 50) errors.push('Enter between 1 and 50 vertices.');
  if (!Array.isArray(edges) || edges.length > 50) errors.push('Enter no more than 50 edges.');
  const labels = (vertices || []).map(v => String(v).trim());
  if (labels.some(v => !v)) errors.push('Vertex labels cannot be empty.');
  if (new Set(labels).size !== labels.length) errors.push('Vertex labels must be unique.');
  const known = new Set(labels), seen = new Set();
  for (let i = 0; i < (edges || []).length; i++) {
    const edge = edges[i];
    if (!Array.isArray(edge) || edge.length !== 2) { errors.push(`Edge ${i + 1} must contain exactly two vertex labels.`); continue; }
    const [a, b] = edge.map(v => String(v).trim());
    if (!known.has(a) || !known.has(b)) errors.push(`Edge ${i + 1} references an unknown vertex (${[a,b].filter(v => !known.has(v)).join(', ')}).`);
    if (a === b) errors.push(`Edge ${i + 1} is a self-loop (${a}).`);
    const key = [a,b].sort().join('\u0000');
    if (seen.has(key)) errors.push(`Duplicate edge: ${a} – ${b}.`);
    seen.add(key);
  }
  return { valid: errors.length === 0, errors, graph: { vertices: labels, edges: edges || [] } };
}

export function adjacencyFor(graph) {
  const adjacency = new Map(graph.vertices.map(v => [v, new Set()]));
  for (const [a,b] of graph.edges) { adjacency.get(a)?.add(b); adjacency.get(b)?.add(a); }
  return adjacency;
}
