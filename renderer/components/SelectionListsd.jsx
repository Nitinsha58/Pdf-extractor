import { useState } from "react";

export default function SelectionList({
  selections,
  activeId,
  onSelect,
  onUpdate,
  onDelete,
}) {
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div style={{ width: "360px", borderLeft: "1px solid #ddd", padding: "10px" }}>
      <h3>Selections ({selections.length})</h3>

      {selections.map(sel => (
        <div
          key={sel.id}
          style={{
            marginBottom: "10px",
            padding: "10px",
            borderRadius: "6px",
            border: sel.id === activeId ? "2px solid #1976d2" : "1px solid #ccc",
            background: sel.id === activeId ? "#eef4ff" : "#fafafa",
            cursor: "pointer"
          }}
          onClick={() => onSelect(sel.id)}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <strong>Box #{sel.index + 1}</strong>
              <div style={{ fontSize: "12px", color: "#666" }}>
                ({Math.round(sel.x)}, {Math.round(sel.y)}) — {Math.round(sel.w)}×{Math.round(sel.h)}
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(sel.id);
                }}
              >
                ✏️
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(sel.id);
                }}
              >
                🗑
              </button>
            </div>
          </div>

          {expandedId === sel.id && (
            <div style={{ marginTop: "10px" }}>
              <label>
                Type
                <select
                  value={sel.meta.type || "question"}
                  onChange={e =>
                    onUpdate(sel.id, { meta: { ...sel.meta, type: e.target.value }})
                  }
                >
                  <option value="question">Question</option>
                  <option value="diagram">Diagram</option>
                  <option value="solution">Solution</option>
                </select>
              </label>

              <label>
                Subject
                <input
                  type="text"
                  value={sel.meta.subject || ""}
                  onChange={e =>
                    onUpdate(sel.id, { meta: { ...sel.meta, subject: e.target.value }})
                  }
                />
              </label>

              <label>
                Topic
                <input
                  type="text"
                  value={sel.meta.topic || ""}
                  onChange={e =>
                    onUpdate(sel.id, { meta: { ...sel.meta, topic: e.target.value }})
                  }
                />
              </label>

              <label>
                Difficulty
                <select
                  value={sel.meta.difficulty || "medium"}
                  onChange={e =>
                    onUpdate(sel.id, { meta: { ...sel.meta, difficulty: e.target.value }})
                  }
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </label>

              <label>
                Tags (comma separated)
                <input
                  type="text"
                  value={sel.meta.tags || ""}
                  onChange={e =>
                    onUpdate(sel.id, { meta: { ...sel.meta, tags: e.target.value }})
                  }
                />
              </label>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
