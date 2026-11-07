// Refreshes the server render hourly so the Dec 1 US price is in the first HTML.
export const revalidate = 3600;

export default function Mh4Layout({ children }: { children: React.ReactNode }) {
  return children;
}
