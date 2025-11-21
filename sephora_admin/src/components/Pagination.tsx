interface Props {
  page: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
}

export default function Pagination({ page, total, pageSize, onChange }: Props) {
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="flex justify-end mt-4 gap-2">
      <button
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        className="px-3 py-1 rounded border border-gray-700 text-gray-300 disabled:opacity-40"
      >
        Prev
      </button>

      <span className="px-3 py-1 text-gray-400">
        {page}/{totalPages}
      </span>

      <button
        disabled={page === totalPages}
        onClick={() => onChange(page + 1)}
        className="px-3 py-1 rounded border border-gray-700 text-gray-300 disabled:opacity-40"
      >
        Next
      </button>
    </div>
  );
}
