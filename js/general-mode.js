/**
 * Derive the visible graph state from the latest validation result.
 * An invalid attempt never carries forward graph data or a coloring from an
 * earlier submission. Valid input also invalidates any coloring of the old graph.
 */
export function generalInputState(checked, previous = {}) {
  return {
    ...previous,
    graph: checked.valid ? checked.graph : { vertices: [], edges: [] },
    colors: null
  };
}
