export default function SelectionList({ deleteSpecificSelection, selections, activeId, onSelect }) {
  return (
    <div className="w-64 border-l border-gray-300 p-3 overflow-y-auto bg-white">
      <h3 className="text-lg font-bold mb-4 text-gray-800">Selections</h3>

      {!selections.length && (
        <p className="text-gray-500 text-sm">No selections yet</p>
      )}

      {selections.map(sel => (
        <div
          key={sel.id}
          onClick={() => onSelect(sel.id)}
          className={`p-3 mb-2 rounded-lg cursor-pointer transition-all ${sel.id === activeId
              ? "border-2 border-blue-600 shadow-md"
              : "border border-gray-300 hover:border-gray-400"
            } ${sel.status === "saved"
              ? "bg-green-50"
              : "bg-gray-50"
            }`}
        >
          <div className="text-sm mb-1">
            <span className="font-semibold text-gray-700">Page:</span>{" "}
            <span className="text-gray-900">{sel.pageNo}</span>
          </div>
          <div className="text-sm mb-1">
            <span className="font-semibold text-gray-700">Type:</span>{" "}
            <span className="text-gray-900">{sel.type}</span>
          </div>
          <div className="text-sm mb-2">
            <span className="font-semibold text-gray-700">Status:</span>{" "}
            <span className={`font-medium ${sel.status === "saved" ? "text-green-700" : "text-gray-900"
              }`}>
              {sel.status}
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteSpecificSelection(sel.id);
            }}
            className="w-full px-3 py-1.5 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}