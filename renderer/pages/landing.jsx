import { useState } from "react";
import PdfViewer from "../components/PdfViewer";
import SelectionList from "../components/SelectionList";
import { v4 as uuidv4 } from "uuid";
import TopNav from "../components/TopNav";
export default function Landing() {
	const [selections, setSelections] = useState([]);
	const [activeId, setActiveId] = useState(null);

	const activeSelection = selections.find((s) => s.id === activeId);
	const clearAllSelection = () => {
		setSelections([]);
	};

	const deleteSpecificSelection = (id) => {
		setSelections((prev) => prev.filter((sel) => sel.id !== id));
		setActiveId(null);
	};

	const handleCreateSelection = (sel) => {
		const id = uuidv4();

		const entry = {
			id,
			pageNo: sel.pageNo,
			rectPdf: sel.rectPdf,
			rectScreen: sel.rectScreen,
			status: "pending",
			type: "question",
			meta: {},
			imagePath: null,
		};

		setSelections((prev) => [...prev, entry]);
		setActiveId(id);
	};

	const handleSelect = (id) => {
		setActiveId(id);
	};
	return (
		<div className="h-screen flex flex-col">
			<TopNav />
			<div style={{ display: "flex", flex: 1, minHeight: 0 }}>
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
		</div>
	);
}
