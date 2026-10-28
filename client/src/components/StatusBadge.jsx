const styles = {
  COMPLETED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  SENT: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  SENDING: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  SCHEDULED: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  FAILED: 'bg-red-50 text-red-700 ring-red-600/20',
  CANCELLED: 'bg-red-50 text-red-700 ring-red-600/20',
  DRAFT: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  PENDING: 'bg-slate-100 text-slate-600 ring-slate-500/20',
};

export default function StatusBadge({ status }) {
  const style = styles[status] || styles.DRAFT;
  const label = status.charAt(0) + status.slice(1).toLowerCase();

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${style}`}
    >
      {label}
    </span>
  );
}
