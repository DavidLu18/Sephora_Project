interface Props {
  search: string;
  rating: string;
  onChange: (filter: Partial<{ search: string; rating: string }>) => void;
}

export default function ReviewFilter({ search, rating, onChange }: Props) {
  return (
    <div className="flex gap-4 mb-4">

      <input
        placeholder="ID sản phẩm"
        value={search}
        onChange={(e) => onChange({ search: e.target.value })}
        className="bg-black/20 border border-gray-700 px-3 py-2 rounded"
      />

      <select
        value={rating}
        onChange={(e) => onChange({ rating: e.target.value })}
        className="bg-black/20 border border-gray-700 px-3 py-2 rounded"
      >
        <option value="">Tất cả sao</option>
        <option value="5">5 sao</option>
        <option value="4">4 sao</option>
        <option value="3">3 sao</option>
        <option value="2">2 sao</option>
        <option value="1">1 sao</option>
      </select>

    </div>
  );
}
