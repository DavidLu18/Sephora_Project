interface CustomerItemProps {
  name: string;
  spent: string | number;
}

export default function CustomerItem({ name, spent }: CustomerItemProps) {
  return (
    <div className="flex justify-between text-sm text-white/90">
      <span>{name}</span>
      <span className="font-semibold">{spent}</span>
    </div>
  );
}
