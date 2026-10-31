/** Log server time for a portal loader. No identifiers, no row data. */
export function portalTimer(route: string): () => void {
  const start = Date.now();
  return () => {
    console.log(`[portal-timing] ${route} ${Date.now() - start}`);
  };
}
