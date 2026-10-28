export default function ProgressBar({ value, size = 'sm' }) {
  const height = size === 'lg' ? 'h-3' : 'h-1.5';

  return (
    <div className={`w-full overflow-hidden rounded-full bg-slate-100 ${height}`}>
      <div
        className={`${height} rounded-full bg-blue-600 transition-all duration-500`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}
