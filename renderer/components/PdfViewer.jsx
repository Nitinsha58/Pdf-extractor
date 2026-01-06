import { useState, useRef, useEffect } from "react";
import pdfjsLib from "../pdf/pdfConfig";
import Toolbar from "./Toolbar";
import CanvasOverlay from "./CanvasOverlay";

export default function PdfViewer({
	clearAllSelection,
	onCropCreate,
	onPageRender,
	selections,
	activeSelection,
	updateActiveSelection,
	isUploading,
	setIsUploading,
	uploadProgress,
	setUploadProgress,
	patchSelectionById,
}) {
	const canvasRefs = useRef({});
	const overlayRefs = useRef({});
	const scrollContainerRef = useRef(null);
	const pageWrapperRefs = useRef({});
	const [pdf, setPdf] = useState(null);
	const [numPages, setNumPages] = useState(0);
	const [zoom, setZoom] = useState(1.5);
	const [mode, setMode] = useState("draw");
	const [rect, setRect] = useState(null);
	const [drawingPageNo, setDrawingPageNo] = useState(null);
	const [classes, setClasses] = useState([]);
	const [subjects, setSubjects] = useState([]);
	const [chapters, setChapters] = useState([]);
	const [imageTypes, setImageTypes] = useState([]);
	const [selectedClassId, setSelectedClassId] = useState(null);
	const [selectedSubjectId, setSelectedSubjectId] = useState(null);
	const [selectedChapterId, setSelectedChapterId] = useState(null);
	const [selectedImageTypeId, setSelectedImageTypeId] = useState(null);
	const [toastMessage, setToastMessage] = useState("");
	const toastTimerRef = useRef(null);
	const skipBeforeUnloadRef = useRef(false);
	const startPos = useRef({ x: 0, y: 0 });
	const viewportByPageRef = useRef({});
	const resizeHandleRef = useRef(null);

	// 1cm at 96 CSS px/inch (approx). Used to prevent accidental click-boxes.
	const MIN_BOX_SIZE_PX = Math.round((96 / 2.54) * 1);

	const API_BASE = "http://localhost:8000";

	useEffect(() => {
		renderAllPages();
	}, [pdf, zoom]);

	useEffect(() => {
		return () => {
			if (toastTimerRef.current) {
				clearTimeout(toastTimerRef.current);
				toastTimerRef.current = null;
			}
		};
	}, []);

	const pushToast = (message) => {
		setToastMessage(message);
		if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
		toastTimerRef.current = setTimeout(() => {
			setToastMessage("");
			toastTimerRef.current = null;
		}, 2500);
	};

	useEffect(() => {
		const loadTaxonomy = async () => {
			try {
				const [classesResp, subjectsResp, imageTypesResp] =
					await Promise.all([
						fetch(`${API_BASE}/api/classes/`),
						fetch(`${API_BASE}/api/subjects/`),
						fetch(`${API_BASE}/api/image-types/`),
					]);
				if (classesResp.ok) setClasses(await classesResp.json());
				if (subjectsResp.ok) setSubjects(await subjectsResp.json());
				if (imageTypesResp.ok) {
					const data = await imageTypesResp.json();
					setImageTypes(data);
					if (
						!selectedImageTypeId &&
						Array.isArray(data) &&
						data.length
					) {
						setSelectedImageTypeId(String(data[0].id));
					}
				}
			} catch (e) {
				console.error("Failed loading taxonomy", e);
			}
		};
		loadTaxonomy();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		const loadChapters = async () => {
			setChapters([]);
			setSelectedChapterId(null);
			if (!selectedClassId || !selectedSubjectId) return;
			try {
				const resp = await fetch(
					`${API_BASE}/api/chapters/?class_id=${encodeURIComponent(
						selectedClassId
					)}&subject_id=${encodeURIComponent(selectedSubjectId)}`
				);
				if (!resp.ok) return;
				setChapters(await resp.json());
			} catch (e) {
				console.error("Failed loading chapters", e);
			}
		};
		loadChapters();
	}, [selectedClassId, selectedSubjectId]);

	useEffect(() => {
		const handleBeforeUnload = (e) => {
			if (skipBeforeUnloadRef.current) return;
			if (!selections?.length) return;
			e.preventDefault();
			// Required for most browsers to show the native confirmation dialog
			e.returnValue = "";
		};

		window.addEventListener("beforeunload", handleBeforeUnload);
		return () =>
			window.removeEventListener("beforeunload", handleBeforeUnload);
	}, [selections]);

	useEffect(() => {
		const sel = activeSelection;
		if (!sel?.pageNo || !sel?.rectScreen) return;
		const container = scrollContainerRef.current;
		const wrapper = pageWrapperRefs.current?.[sel.pageNo];
		if (!container || !wrapper) return;

		// Scroll to page + approximate y within the page.
		const yInPage = Number(sel.rectScreen?.y || 0);
		const top = Math.max(0, wrapper.offsetTop + yInPage - 40);
		container.scrollTo({ top, behavior: "smooth" });
	}, [activeSelection?.id]);

	// Upload captured selections to backend with random metadata
	const uploadSelections = async () => {
		if (!selections?.length) {
			pushToast("No selections to upload.");
			return;
		}
		if (isUploading) return;

		setIsUploading?.(true);
		setUploadProgress?.({ current: 0, total: selections.length });
		pushToast(`Uploading ${selections.length} selection(s)...`);

		try {
			const items = [];
			const form = new FormData();

			for (let i = 0; i < selections.length; i++) {
				const sel = selections[i];
				setUploadProgress?.({ current: i, total: selections.length });

				const classId = sel.classId || selectedClassId;
				const subjectId = sel.subjectId || selectedSubjectId;
				const chapterId = sel.chapterId || selectedChapterId;
				const imageTypeId = sel.imageTypeId || selectedImageTypeId;

				if (!classId || !subjectId || !chapterId || !imageTypeId) {
					throw new Error(
						"Missing class/subject/chapter/image type for a selection."
					);
				}

				const pageCanvas = canvasRefs.current?.[sel.pageNo];
				if (!pageCanvas) {
					throw new Error(`Missing canvas for page ${sel.pageNo}`);
				}

				const { x, y, w, h } = sel.rectScreen;
				const off = document.createElement("canvas");
				off.width = Math.max(1, Math.round(w));
				off.height = Math.max(1, Math.round(h));
				const octx = off.getContext("2d");
				octx.drawImage(
					pageCanvas,
					x,
					y,
					w,
					h,
					0,
					0,
					off.width,
					off.height
				);

				const blob = await new Promise((res) =>
					off.toBlob(res, "image/png")
				);
				if (!blob) {
					throw new Error(
						`Failed to create image for selection ${sel.id}`
					);
				}

				form.append(`image_${i}`, blob, `crop-${sel.id}.png`);
				items.push({
					rectPdf: sel.rectPdf || {},
					rectScreen: sel.rectScreen || {},
					classId: String(classId),
					subjectId: String(subjectId),
					chapterId: String(chapterId),
					imageType: String(imageTypeId),
				});
			}

			form.append("items", JSON.stringify(items));
			setUploadProgress?.({
				current: selections.length,
				total: selections.length,
			});

			const resp = await fetch(`${API_BASE}/api/upload-crop-bulk/`, {
				method: "POST",
				body: form,
			});

			if (!resp.ok) {
				const txt = await resp.text();
				console.error("Bulk upload failed:", resp.status, txt);
				pushToast("Upload failed. Nothing was saved.");
				return;
			}

			// All succeeded -> refresh page as requested
			skipBeforeUnloadRef.current = true;
			window.location.reload();
		} catch (err) {
			console.error("Upload aborted:", err);
			pushToast(err?.message || "Upload aborted.");
		} finally {
			setIsUploading?.(false);
		}
	};

	const openPdf = async () => {
		const [fileHandle] = await window.showOpenFilePicker({
			types: [
				{ description: "PDF", accept: { "application/pdf": [".pdf"] } },
			],
		});
		const file = await fileHandle.getFile();
		const buffer = await file.arrayBuffer();
		const loaded = await pdfjsLib.getDocument({ data: buffer }).promise;
		setPdf({ ref: loaded, name: file.name });
		setNumPages(loaded.numPages || 0);
		clearAllSelection();
	};

	const renderPage = async (pageNo) => {
		if (!pdf?.ref) return;
		const canvas = canvasRefs.current?.[pageNo];
		if (!canvas) return;
		const page = await pdf.ref.getPage(pageNo);
		const viewport = page.getViewport({ scale: zoom });
		const ctx = canvas.getContext("2d");
		canvas.width = viewport.width;
		canvas.height = viewport.height;
		await page.render({ canvasContext: ctx, viewport }).promise;
		viewportByPageRef.current[pageNo] = viewport;
		onPageRender?.({ page, viewport, canvas });
	};

	const renderAllPages = async () => {
		if (!pdf?.ref) return;
		const total = pdf.ref.numPages || numPages || 0;
		if (!total) return;
		setNumPages(total);
		for (let p = 1; p <= total; p += 1) {
			// sequential rendering keeps memory lower
			// and avoids hammering the main thread
			// eslint-disable-next-line no-await-in-loop
			await renderPage(p);
		}
	};

	const getSelectionsForPage = (targetPageNo) =>
		(selections || []).filter((s) => s?.pageNo === targetPageNo);

	const getNameById = (items, id) => {
		if (!id) return "";
		const found = (items || []).find((it) => String(it.id) === String(id));
		return found?.name || "";
	};

	const ensureChapterSelectedForDrawing = () => {
		if (selectedChapterId) return true;
		pushToast("Select chapter first before drawing.");
		return false;
	};

	const handleMouseDown = (e, pageNo) => {
		if (e.button !== 0) return; // Only proceed for left mouse button
		if (isUploading) return;
		if (mode !== "draw") return;
		const canvas = canvasRefs.current?.[pageNo];
		if (!canvas) return;
		if (!viewportByPageRef.current?.[pageNo]) return;

		const bounds = canvas.getBoundingClientRect();
		const x = e.clientX - bounds.left;
		const y = e.clientY - bounds.top;

		const selectionsForPage = getSelectionsForPage(pageNo);

		// Check if clicking on an existing selection (current page only)
		const clickedSelection = selectionsForPage.find(
			(sel) =>
				x >= sel.rectScreen.x &&
				x <= sel.rectScreen.x + sel.rectScreen.w &&
				y >= sel.rectScreen.y &&
				y <= sel.rectScreen.y + sel.rectScreen.h
		);

		if (clickedSelection) {
			updateActiveSelection(clickedSelection);
			return;
		}

		if (!ensureChapterSelectedForDrawing()) return;

		// Start drawing a new rectangle
		startPos.current = { x, y };
		setRect({ x, y, w: 0, h: 0 });
		setDrawingPageNo(pageNo);
		updateActiveSelection(null); // Deselect any active selection
	};

	const handleMouseMove = (e, pageNo) => {
		if (isUploading) return;
		if (!rect || drawingPageNo !== pageNo) return;
		const canvas = canvasRefs.current?.[pageNo];
		if (!canvas) return;

		const bounds = canvas.getBoundingClientRect();
		const x = e.clientX - bounds.left;
		const y = e.clientY - bounds.top;

		const rx = Math.min(x, startPos.current.x);
		const ry = Math.min(y, startPos.current.y);
		const rw = Math.abs(x - startPos.current.x);
		const rh = Math.abs(y - startPos.current.y);

		setRect({ x: rx, y: ry, w: rw, h: rh });
	};

	const handleMouseUp = (e, pageNo) => {
		if (isUploading) return;
		if (!rect || drawingPageNo !== pageNo) return;
		const viewport = viewportByPageRef.current?.[pageNo];
		if (!viewport) return;

		// Chapter is required for creating a box
		if (!selectedChapterId) {
			setRect(null);
			setDrawingPageNo(null);
			pushToast("Select chapter first before drawing.");
			return;
		}

		const selectionsForPage = getSelectionsForPage(pageNo);

		// Minimum size to prevent accidental click-boxes
		if (rect.w < MIN_BOX_SIZE_PX || rect.h < MIN_BOX_SIZE_PX) {
			setRect(null);
			setDrawingPageNo(null);
			pushToast("Minimum box size is 1cm × 1cm.");
			return;
		}

		// Check if the rectangle overlaps with existing selections (current page only)
		const overlaps = selectionsForPage.some(
			(sel) =>
				rect.x + rect.w > sel.rectScreen.x &&
				rect.x < sel.rectScreen.x + sel.rectScreen.w &&
				rect.y + rect.h > sel.rectScreen.y &&
				rect.y < sel.rectScreen.y + sel.rectScreen.h
		);

		if (overlaps) {
			setRect(null);
			setDrawingPageNo(null);
			return;
		}

		const scale = 1 / viewport.scale;
		const pdfRect = {
			x: Math.round(rect.x * scale),
			y: Math.round(rect.y * scale),
			w: Math.round(rect.w * scale),
			h: Math.round(rect.h * scale),
		};

		const newSelection = {
			id: `${pageNo}-${Date.now()}`,
			rectScreen: rect,
			rectPdf: pdfRect,
			pageNo,
			classId: selectedClassId,
			className: getNameById(classes, selectedClassId),
			subjectId: selectedSubjectId,
			subjectName: getNameById(subjects, selectedSubjectId),
			chapterId: selectedChapterId,
			chapterName: getNameById(chapters, selectedChapterId),
			imageTypeId: selectedImageTypeId,
			imageTypeName: getNameById(imageTypes, selectedImageTypeId),
			status: "unsaved",
		};

		onCropCreate?.(newSelection);
		// Activate the new selection so list + scroll syncing works immediately
		updateActiveSelection?.(newSelection);
		setRect(null);
		setDrawingPageNo(null);
	};

	// 🔹 Store starting mouse + rect values for smoother resize
	const handleResizeStart = (e, handle, pageNo) => {
		if (isUploading) return;
		e.stopPropagation();
		const canvas = canvasRefs.current?.[pageNo];
		if (!canvas) return;
		const bounds = canvas.getBoundingClientRect();

		// store start mouse, start rect and a reference to the selection being resized
		resizeHandleRef.current = {
			handle,
			startMouse: {
				x: e.clientX - bounds.left,
				y: e.clientY - bounds.top,
			},
			startRect: { ...activeSelection.rectScreen },
			startSelection: { ...activeSelection },
			currentSelection: null,
		};

		document.addEventListener("mousemove", handleResizeMove);
		document.addEventListener("mouseup", handleResizeEnd);
	};

	const handleResizeMove = (e) => {
		if (isUploading) return;
		if (!resizeHandleRef.current) return;
		const pageNo =
			resizeHandleRef.current?.startSelection?.pageNo ||
			activeSelection?.pageNo;
		const canvas = pageNo ? canvasRefs.current?.[pageNo] : null;
		if (!canvas) return;
		const bounds = canvas.getBoundingClientRect();
		const x = e.clientX - bounds.left;
		const y = e.clientY - bounds.top;

		const { handle, startMouse, startRect, startSelection } =
			resizeHandleRef.current;

		const dx = x - startMouse.x;
		const dy = y - startMouse.y;

		const updatedRect = { ...startRect };

		// 🔹 East (right)
		if (handle.includes("e")) {
			updatedRect.w = startRect.w + dx;
		}

		// 🔹 South (bottom)
		if (handle.includes("s")) {
			updatedRect.h = startRect.h + dy;
		}

		// 🔹 West (left)
		if (handle.includes("w")) {
			updatedRect.x = startRect.x + dx;
			updatedRect.w = startRect.w - dx;
		}

		// 🔹 North (top)
		if (handle.includes("n")) {
			updatedRect.y = startRect.y + dy;
			updatedRect.h = startRect.h - dy;
		}

		// 🔹 Prevent inversion
		updatedRect.w = Math.max(10, updatedRect.w);
		updatedRect.h = Math.max(10, updatedRect.h);

		const selectionsForPage = getSelectionsForPage(
			activeSelection?.pageNo ?? pageNo
		);
		const overlaps = selectionsForPage.some(
			(sel) =>
				sel.id !== activeSelection.id &&
				updatedRect.x < sel.rectScreen.x + sel.rectScreen.w &&
				updatedRect.x + updatedRect.w > sel.rectScreen.x &&
				updatedRect.y < sel.rectScreen.y + sel.rectScreen.h &&
				updatedRect.y + updatedRect.h > sel.rectScreen.y
		);

		if (overlaps) return; // 🚫 block resize into another box

		const viewport = viewportByPageRef.current?.[activeSelection?.pageNo];
		if (!viewport) return;
		// 🔹 Convert to PDF coords (scale-aware)
		const scale = 1 / viewport.scale;

		const pdfRect = {
			x: Math.round(updatedRect.x * scale),
			y: Math.round(updatedRect.y * scale),
			w: Math.round(updatedRect.w * scale),
			h: Math.round(updatedRect.h * scale),
		};

		const updatedSelection = {
			...startSelection,
			rectScreen: updatedRect,
			rectPdf: pdfRect,
		};

		// store the current virtual selection so handleResizeEnd can persist it
		resizeHandleRef.current.currentSelection = updatedSelection;

		updateActiveSelection(updatedSelection);
	};

	const handleResizeEnd = () => {
		document.removeEventListener("mousemove", handleResizeMove);
		document.removeEventListener("mouseup", handleResizeEnd);

		// grab the last virtual selection (if any) before clearing the ref
		const finalSel =
			resizeHandleRef.current?.currentSelection ||
			resizeHandleRef.current?.startSelection ||
			null;

		resizeHandleRef.current = null;

		if (!finalSel) return;

		// persist the final selection
		updateActiveSelection({ ...finalSel });
	};

	return (
		<div className="flex flex-col h-screen bg-gray-50">
			{toastMessage ? (
				<div className="fixed top-4 right-4 z-50">
					<div className="bg-white border border-gray-300 text-gray-900 px-4 py-3 rounded shadow-md max-w-sm">
						<div className="flex items-start gap-3">
							<div className="flex-1 text-sm">{toastMessage}</div>
							<button
								onClick={() => setToastMessage("")}
								className="text-gray-500 hover:text-gray-700 leading-none"
								aria-label="Close notification">
								×
							</button>
						</div>
					</div>
				</div>
			) : null}
			<Toolbar
				openPdf={openPdf}
				pdf={pdf}
				mode={mode}
				setMode={setMode}
				onUpload={uploadSelections}
				isUploading={isUploading}
				uploadProgress={uploadProgress}
				classes={classes}
				subjects={subjects}
				chapters={chapters}
				imageTypes={imageTypes}
				selectedClassId={selectedClassId}
				setSelectedClassId={setSelectedClassId}
				selectedSubjectId={selectedSubjectId}
				setSelectedSubjectId={setSelectedSubjectId}
				selectedChapterId={selectedChapterId}
				setSelectedChapterId={setSelectedChapterId}
				selectedImageTypeId={selectedImageTypeId}
				setSelectedImageTypeId={setSelectedImageTypeId}
			/>
			<div
				ref={scrollContainerRef}
				className="flex-1 overflow-auto bg-gray-100 p-4">
				<div className="flex flex-col gap-6">
					{Array.from({ length: numPages || 0 }, (_, i) => i + 1).map(
						(p) => (
							<div
								key={p}
								ref={(el) => {
									if (el) pageWrapperRefs.current[p] = el;
								}}
								className="inline-block">
								<div className="relative inline-block">
									<canvas
										ref={(el) => {
											if (el) canvasRefs.current[p] = el;
										}}
										onMouseDown={(e) =>
											handleMouseDown(e, p)
										}
										onMouseMove={(e) =>
											handleMouseMove(e, p)
										}
										onMouseUp={(e) => handleMouseUp(e, p)}
										className="border border-gray-400 shadow-lg bg-white cursor-crosshair"
									/>
									<CanvasOverlay
										overlayRef={(el) => {
											if (el) overlayRefs.current[p] = el;
										}}
										selections={selections}
										rect={drawingPageNo === p ? rect : null}
										pageNo={p}
										activeSelection={activeSelection}
										onResizeHandleMouseDown={(e, handle) =>
											handleResizeStart(e, handle, p)
										}
									/>
								</div>
							</div>
						)
					)}
				</div>
			</div>
		</div>
	);
}
