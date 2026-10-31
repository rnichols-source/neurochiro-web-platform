export default function LineChart({ points }: { points: number[] }) {
  if (points.length < 14) {
    return <p className="text-sm text-portal-muted">Not enough data yet.</p>;
  }
  const width = 320;
  const height = 96;
  const max = Math.max(...points, 1);
  const step = width / Math.max(points.length - 1, 1);
  const d = points.map((value, index) => {
    const x = index * step;
    const y = height - (value / max) * (height - 8) - 4;
    return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-24" role="img" aria-label="Profile views over the last 30 days">
      <path d={d} fill="none" stroke="#d66829" strokeWidth="2" />
    </svg>
  );
}
