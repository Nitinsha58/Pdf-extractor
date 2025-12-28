export default function SelectionList({ selections, activeId, onSelect }) {
  return (
    <div style={{
      width: 260,
      borderLeft: "1px solid #ddd",
      padding: 10,
      overflowY: "auto"
    }}>
      <h3>Selections</h3>

      {!selections.length && <p>No selections yet</p>}

      {selections.map(sel => (
        <div
          key={sel.id}
          onClick={() => onSelect(sel.id)}
          style={{
            padding: 10,
            marginBottom: 8,
            borderRadius: 8,
            border: sel.id === activeId
              ? "2px solid #007bff"
              : "1px solid #ccc",
            background: sel.status === "saved"
              ? "#e9ffe9"
              : "#f8f8f8",
            cursor: "pointer"
          }}
        >
          <div><b>Page:</b> {sel.pageNo}</div>
          <div><b>Type:</b> {sel.type}</div>
          <div><b>Status:</b> {sel.status}</div>
        </div>
      ))}
    </div>
  );
}
