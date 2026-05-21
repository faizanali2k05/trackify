/** Compact, collision-resistant id for local entities. Not cryptographically secure. */
export function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
