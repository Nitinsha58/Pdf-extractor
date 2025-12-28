import { useState } from "react";
import PdfViewer from "./components/PdfViewer";
import SelectionList from "./components/SelectionList";
import { v4 as uuidv4 } from "uuid";

export default function App() {
  const [selections, setSelections] = useState([]);
  const [activeId, setActiveId] = useState(null);

  const activeSelection = selections.find(s => s.id === activeId);
  const clearAllSelection = () => {
    setSelections([])
  };

  const deleteSpecificSelection = id => {
    setSelections(prev => prev.filter(sel => sel.id !== id));
    setActiveId(null);
  };

  const handleCreateSelection = sel => {
    const id = uuidv4();

    const entry = {
      id,
      pageNo: sel.pageNo,
      rectPdf: sel.rectPdf,
      rectScreen: sel.rectScreen,
      status: "pending",
      type: "question",
      meta: {},
      imagePath: null
    };

    setSelections(prev => [...prev, entry]);
    setActiveId(id);
  };

  const handleSelect = id => {
    setActiveId(id);
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>

      <PdfViewer
        onCropCreate={handleCreateSelection}
        clearAllSelection={clearAllSelection}
        selections={selections}
        activeSelection={activeSelection}
      />

      <SelectionList
        deleteSpecificSelection={deleteSpecificSelection}
        selections={selections}
        activeId={activeId}
        onSelect={handleSelect}
      />

    </div>
  );
}
