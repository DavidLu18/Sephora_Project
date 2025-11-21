interface InsightRowProps {
  label: string;
  value: string | number;
}

export default function InsightRow({ label, value }: InsightRowProps) {
  return (
    <div className="flex justify-between text-sm text-white/80">
      <span>{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}
