interface StatCardProps {
  label: string;
  value: string | number;
  loading?: boolean;
}

export default function StatCard({ label, value, loading }: StatCardProps) {
  return (
    <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
      <p className="text-sm text-white/60">{label}</p>

      {loading ? (
        <div className="mt-2 h-6 w-14 bg-white/10 animate-pulse rounded" />
      ) : (
        <h3 className="text-2xl font-bold mt-1">{value}</h3>
      )}
    </div>
  );
}
