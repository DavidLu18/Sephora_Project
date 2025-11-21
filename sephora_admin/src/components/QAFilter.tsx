interface Props {
  search: string;
  answered: string;
  onChange: (filter: Partial<{ search: string; answered: string }>) => void;
}

export default function QAFilter({ search, answered, onChange }: Props) {
  return (
    <div className="flex gap-4 mb-4">

      <input
        placeholder="Tìm theo ID hoặc SKU"
        value={search}
        onChange={(e) => onChange({ search: e.target.value })}
        className="bg-black/20 border border-gray-700 px-3 py-2 rounded"
      />

      <select
        value={answered}
        onChange={(e) => onChange({ answered: e.target.value })}
        className="bg-black/20 border border-gray-700 px-3 py-2 rounded"
      >
        <option value="">Tất cả</option>
        <option value="true">Đã trả lời</option>
        <option value="false">Chưa trả lời</option>
      </select>

    </div>
  );
}
