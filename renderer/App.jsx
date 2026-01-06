import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { useState } from "react";
import Landing from "./pages/landing";
import QuestionView from "./pages/questionView";
import Concept from "./pages/concept";
import Chapter from "./pages/chapter";
import Classes from "./pages/classes";
import Subject from "./pages/subject";
import Home from "./pages/home";
import FilterUpdate from "./pages/filterUpdate.jsx";
import FilterImages from "./pages/filterImages.jsx";
import PdfViewer from "./components/PdfViewer";
import SelectionList from "./components/SelectionList";
import TopNav from "./components/TopNav";

export default function App() {
	const ViewerPage = () => {
		const [selections, setSelections] = useState([]);
		const [activeSelection, setActiveSelection] = useState(null);
		const [isUploading, setIsUploading] = useState(false);
		const [uploadProgress, setUploadProgress] = useState({
			current: 0,
			total: 0,
		});

		const handleCropCreate = (newSelection) => {
			setSelections((prev) => [...prev, newSelection]);
		};

		const handleSelect = (id) => {
			// Toggle: clicking the active item deselects
			if (activeSelection?.id === id) {
				setActiveSelection(null);
				return;
			}
			const selected = selections.find((sel) => sel.id === id);
			setActiveSelection(selected || null);
		};

		const deleteSpecificSelection = (id) => {
			setSelections((prev) => prev.filter((sel) => sel.id !== id));
			if (activeSelection?.id === id) {
				setActiveSelection(null);
			}
		};

		const updateActiveSelection = (selection) => {
			// allow clearing active selection by passing null
			if (!selection) {
				setActiveSelection(null);
				return;
			}

			setActiveSelection(selection);
			setSelections((prev) =>
				prev.map((sel) => (sel.id === selection.id ? selection : sel))
			);
		};

		const patchSelectionById = (id, patch) => {
			setSelections((prev) =>
				prev.map((sel) => (sel.id === id ? { ...sel, ...patch } : sel))
			);
			if (activeSelection?.id === id) {
				setActiveSelection((prev) =>
					prev ? { ...prev, ...patch } : prev
				);
			}
		};

		return (
			<div className="h-screen flex flex-col">
				<TopNav />
				<div className="flex flex-1 min-h-0 relative">
					<div className="flex-1 min-w-0">
						<PdfViewer
							clearAllSelection={() => setSelections([])}
							onCropCreate={handleCropCreate}
							onPageRender={() => {}}
							selections={selections}
							activeSelection={activeSelection}
							updateActiveSelection={updateActiveSelection}
							isUploading={isUploading}
							setIsUploading={setIsUploading}
							uploadProgress={uploadProgress}
							setUploadProgress={setUploadProgress}
							patchSelectionById={patchSelectionById}
						/>
					</div>
					<SelectionList
						selections={selections}
						activeId={activeSelection?.id}
						onSelect={handleSelect}
						onUpdateSelection={updateActiveSelection}
						deleteSpecificSelection={deleteSpecificSelection}
						disabled={isUploading}
					/>
				</div>
			</div>
		);
	};

	return (
		<BrowserRouter>
			<Routes>
				<Route path="/home" element={<Home />} />
				<Route path="/" element={<ViewerPage />} />
				<Route path="/landing" element={<Landing />} />
				<Route path="/view" element={<QuestionView />} />
				<Route path="/filter-update" element={<FilterUpdate />} />
				<Route path="/filter-images" element={<FilterImages />} />
				<Route path="/concept" element={<Concept />} />
				<Route path="/chapter" element={<Chapter />} />
				<Route path="/classes" element={<Classes />} />
				<Route path="/subject" element={<Subject />} />
			</Routes>
		</BrowserRouter>
	);
}
