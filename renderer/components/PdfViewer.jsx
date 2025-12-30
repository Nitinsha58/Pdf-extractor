import { useState, useRef, useEffect } from "react";
import pdfjsLib from "../pdf/pdfConfig";
import { v4 as uuidv4 } from "uuid";
import { loadData } from "../data";

export default function PdfViewer({
  clearAllSelection,
  onCropCreate,
  onPageRender,
  selections,
  activeSelection
}) {
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const [pdf, setPdf] = useState(null);
  const [pageNo, setPageNo] = useState(1);
  const [zoom, setZoom] = useState(1.5);
  const [mode, setMode] = useState("draw");
  const [activeId, setActiveId] = useState(null);
  const [resizing, setResizing] = useState(null);

  // Relation data
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [concepts, setConcepts] = useState([]);

  // Selection modal
  const [showModal, setShowModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [selectedConcept, setSelectedConcept] = useState('');

  // Additional attributes
  const [questionType, setQuestionType] = useState('MCQ');
  const [difficulty, setDifficulty] = useState('easy');
  const [marks, setMarks] = useState(1);
  const [usage, setUsage] = useState('HW');
  const [priority, setPriority] = useState(0);

  // crop state
  const [dragging, setDragging] = useState(false);
  const [rect, setRect] = useState(null);
  const startPos = useRef({ x: 0, y: 0 });
  const viewportRef = useRef(null);
  const pageRef = useRef(null);

  let dbFolderHandle = useRef(null);

  useEffect(() => {
    const fetchRelationData = async () => {
      const result = await loadData();
      const savedClasses = localStorage.getItem('classes');
      setClasses(savedClasses ? JSON.parse(savedClasses) : result.classes);
      const savedSubjects = localStorage.getItem('subject');
      setSubjects(savedSubjects ? JSON.parse(savedSubjects) : result.subject);
      const savedChapters = localStorage.getItem('chapter');
      setChapters(savedChapters ? JSON.parse(savedChapters) : result.chapter);
      const savedConcepts = localStorage.getItem('concept');
      setConcepts(savedConcepts ? JSON.parse(savedConcepts) : result.concept);
    };
    fetchRelationData();
  }, []);

  const filteredChapters = chapters.filter(chapter => {
    const matchClass = !selectedClass || chapter.classId === selectedClass;
    const matchSubject = !selectedSubject || chapter.subjectId === selectedSubject;
    return matchClass && matchSubject;
  });

  const filteredConcepts = concepts.filter(concept => {
    return !selectedChapter || concept.chapterId === selectedChapter;
  });

  const downloadSelectionsToFolder = async () => {
    if (!selections.length) {
      alert("No selections to download");
      return;
    }
    setShowModal(true);
  };

  const confirmDownload = async () => {
    if (!selectedClass || !selectedSubject || !selectedChapter || !selectedConcept) {
      alert("Please select Class, Subject, Chapter, and Concept");
      return;
    }
    setShowModal(false);

    try {
      if (!dbFolderHandle.current) {
        dbFolderHandle.current = await window.showDirectoryPicker();
      }

      try {
        await dbFolderHandle.current.requestPermission({ mode: 'readwrite' });
      } catch (err) {
        dbFolderHandle.current = await window.showDirectoryPicker();
      }

      let existingMetadata = [];
      try {
        const storedMetadata = localStorage.getItem('imageMetadata');
        if (storedMetadata) {
          existingMetadata = JSON.parse(storedMetadata);
        }
      } catch (err) {
        console.log('No existing metadata found in localStorage, creating new one');
      }

      const newMetadata = [];
      for (let i = 0; i < selections.length; i++) {
        const sel = selections[i];
        const page = await pdf.ref.getPage(sel.pageNo);
        const scale = 2;
        const viewport = page.getViewport({ scale });

        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = viewport.width;
        tempCanvas.height = viewport.height;
        await page.render({ canvasContext: tempCtx, viewport: viewport }).promise;

        const croppedCanvas = document.createElement('canvas');
        const croppedCtx = croppedCanvas.getContext('2d');
        croppedCanvas.width = sel.rectPdf.w * scale;
        croppedCanvas.height = sel.rectPdf.h * scale;
        croppedCtx.drawImage(
          tempCanvas,
          sel.rectPdf.x * scale,
          sel.rectPdf.y * scale,
          sel.rectPdf.w * scale,
          sel.rectPdf.h * scale,
          0,
          0,
          sel.rectPdf.w * scale,
          sel.rectPdf.h * scale
        );

        const blob = await new Promise(resolve => croppedCanvas.toBlob(resolve, 'image/png'));
        const imageUuid = sel.id || uuidv4();
        const filename = `${imageUuid}.png`;

        const fileHandle = await dbFolderHandle.current.getFileHandle(filename, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();

        newMetadata.push({
          id: imageUuid,
          filename: filename,
          filepath: `./${filename}`,
          pageNo: sel.pageNo,
          type: sel.type,
          status: sel.status,
          rectPdf: sel.rectPdf,
          rectScreen: sel.rectScreen,
          classId: selectedClass,
          subjectId: selectedSubject,
          chapterId: selectedChapter,
          conceptId: selectedConcept,
          questionType: questionType,
          difficulty: difficulty,
          marks: marks,
          usage: usage,
          priority: priority,
          verified: false,
          active: true,
          meta: sel.meta,
          timestamp: new Date().toISOString()
        });
      }

      const combinedMetadata = [...existingMetadata, ...newMetadata];
      localStorage.setItem('imageMetadata', JSON.stringify(combinedMetadata));
      alert(`✅ Saved ${selections.length} new images to folder. Total: ${combinedMetadata.length} images. Metadata saved to localStorage.`);

      setSelectedClass('');
      setSelectedSubject('');
      setSelectedChapter('');
      setSelectedConcept('');
      setQuestionType('MCQ');
      setDifficulty('easy');
      setMarks(1);
      setUsage('HW');
      setPriority(0);
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('User cancelled folder selection');
      } else {
        console.error('Error writing files:', err);
        alert('Error saving files: ' + err.message);
      }
    }
  };

  const openPdf = async () => {
    const [fileHandle] = await window.showOpenFilePicker({
      types: [{ description: "PDF", accept: { "application/pdf": [".pdf"] } }]
    });
    const file = await fileHandle.getFile();
    const buffer = await file.arrayBuffer();
    const loaded = await pdfjsLib.getDocument({ data: buffer }).promise;
    setPdf({ ref: loaded, name: file.name });
    setPageNo(1);
    clearAllSelection();
  };

  const startResize = (e, sel, handle) => {
    e.stopPropagation();
    setResizing({ sel, handle, startX: e.clientX, startY: e.clientY });
  };

  const renderPage = async () => {
    if (!pdf) return;
    const page = await pdf.ref.getPage(pageNo);
    const viewport = page.getViewport({ scale: zoom });
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: ctx, viewport }).promise;
    pageRef.current = page;
    viewportRef.current = viewport;
    onPageRender?.({ page, viewport, canvas });
  };

  const onSelect = (selection) => {
    if (mode === "select") {
      onCropCreate?.(selection);
    }
  };

  useEffect(() => {
    renderPage();
  }, [pdf, pageNo, zoom]);

  const overlapsExisting = (r) => {
    return selections.some(s =>
      s.pageNo === pageNo &&
      !(
        r.x + r.w < s.rectScreen.x ||
        r.x > s.rectScreen.x + s.rectScreen.w ||
        r.y + r.h < s.rectScreen.y ||
        r.y > s.rectScreen.y + s.rectScreen.h
      )
    );
  };

  const handleMouseDown = e => {
    if (!viewportRef.current) return;
    if (e.button !== 0) return;
    if (mode !== "draw") return;
    if (resizing) return;
    const bounds = canvasRef.current.getBoundingClientRect();
    startPos.current = { x: e.clientX - bounds.left, y: e.clientY - bounds.top };
    setRect(null);
    setDragging(true);
  };

  const hitTest = (x, y) => {
    return selections.find(sel =>
      x >= sel.x && x <= sel.x + sel.w && y >= sel.y && y <= sel.y + sel.h
    );
  };

  const handleCanvasClick = (e) => {
    if (mode !== "select") return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const hit = hitTest(x, y);
    if (hit) {
      setActiveId(hit.id);
    } else {
      setActiveId(null);
    }
  };

  const handleMouseMove = e => {
    const bounds = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - bounds.left;
    const y = e.clientY - bounds.top;

    if (resizing) {
      const { sel, handle } = resizing;
      const r = { ...sel.rectScreen };
      if (handle.includes("w")) {
        r.w += r.x - x;
        r.x = x;
      }
      if (handle.includes("n")) {
        r.h += r.y - y;
        r.y = y;
      }
      if (handle.includes("e")) {
        r.w = x - r.x;
      }
      if (handle.includes("s")) {
        r.h = y - r.y;
      }
      r.w = Math.max(10, r.w);
      r.h = Math.max(10, r.h);
      sel.rectScreen = r;
      return;
    }

    if (!dragging) return;
    const rx = Math.min(x, startPos.current.x);
    const ry = Math.min(y, startPos.current.y);
    const rw = Math.abs(x - startPos.current.x);
    const rh = Math.abs(y - startPos.current.y);
    setRect({ x: rx, y: ry, w: rw, h: rh });
  };

  const handleMouseUp = () => {
    if (resizing) {
      setResizing(null);
      return;
    }
    if (!dragging || !rect) {
      setDragging(false);
      return;
    }
    setDragging(false);
    if (overlapsExisting(rect)) {
      setRect(null);
      return;
    }
    if (!rect || !viewportRef.current) {
      setDragging(false);
      return;
    }
    setDragging(false);
    const scale = 1 / viewportRef.current.scale;
    const pdfRect = {
      x: Math.round(rect.x * scale),
      y: Math.round(rect.y * scale),
      w: Math.round(rect.w * scale),
      h: Math.round(rect.h * scale)
    };
    onCropCreate?.({
      rectPdf: pdfRect,
      rectScreen: rect,
      pageNo,
      page: pageRef.current,
      viewport: viewportRef.current
    });
    setRect(null);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Top Toolbar */}
      <div className="flex items-center gap-2 p-3 bg-white border-b border-gray-200 flex-wrap">
        <button
          onClick={openPdf}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          📂 Open PDF
        </button>

        <button
          onClick={() => setPageNo(p => Math.max(1, p - 1))}
          disabled={pageNo <= 1}
          className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          ◀ Prev
        </button>

        <span className="px-4 py-2 bg-gray-100 rounded">
          Page {pageNo} / {pdf?.ref?.numPages || "--"}
        </span>

        <button
          onClick={() => setPageNo(p => Math.min(pdf?.ref?.numPages || p, p + 1))}
          disabled={!pdf || pageNo >= pdf.ref.numPages}
          className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next ▶
        </button>

        <div className="h-8 w-px bg-gray-300 mx-2"></div>

        <button
          onClick={() => setMode("draw")}
          className={`px-4 py-2 rounded transition-colors ${mode === "draw"
              ? "bg-blue-600 text-white border-2 border-blue-700"
              : "bg-white border border-gray-300 hover:bg-gray-100"
            }`}
        >
          ✏️ Draw
        </button>

        <button
          onClick={() => setMode("select")}
          className={`px-4 py-2 rounded transition-colors ${mode === "select"
              ? "bg-blue-600 text-white border-2 border-blue-700"
              : "bg-white border border-gray-300 hover:bg-gray-100"
            }`}
        >
          🖱 Select/Edit
        </button>

        <button
          onClick={() => setMode("delete")}
          className={`px-4 py-2 rounded transition-colors ${mode === "delete"
              ? "bg-blue-600 text-white border-2 border-blue-700"
              : "bg-white border border-gray-300 hover:bg-gray-100"
            }`}
        >
          🗑 Delete
        </button>

        <button
          onClick={downloadSelectionsToFolder}
          disabled={!selections.length}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          💾 Download All Selections
        </button>

        <div className="h-8 w-px bg-gray-300 mx-2"></div>

        <button
          onClick={() => setZoom(z => z + 0.25)}
          className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
        >
          Zoom +
        </button>

        <button
          onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
          className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
        >
          Zoom -
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-6">Select Relations for Images</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Class:
                  </label>
                  <select
                    value={selectedClass}
                    onChange={(e) => {
                      setSelectedClass(e.target.value);
                      setSelectedChapter('');
                      setSelectedConcept('');
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Class</option>
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject:
                  </label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => {
                      setSelectedSubject(e.target.value);
                      setSelectedChapter('');
                      setSelectedConcept('');
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map(subj => (
                      <option key={subj.id} value={subj.id}>{subj.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chapter:
                  </label>
                  <select
                    value={selectedChapter}
                    onChange={(e) => {
                      setSelectedChapter(e.target.value);
                      setSelectedConcept('');
                    }}
                    disabled={!selectedClass || !selectedSubject}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Select Chapter</option>
                    {filteredChapters.map(chap => (
                      <option key={chap.id} value={chap.id}>{chap.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Concept:
                  </label>
                  <select
                    value={selectedConcept}
                    onChange={(e) => setSelectedConcept(e.target.value)}
                    disabled={!selectedChapter}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Select Concept</option>
                    {filteredConcepts.map(concept => (
                      <option key={concept.id} value={concept.id}>{concept.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question Type:
                  </label>
                  <select
                    value={questionType}
                    onChange={(e) => setQuestionType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="MCQ">MCQ</option>
                    <option value="Numerical">Numerical</option>
                    <option value="Theory">Theory</option>
                    <option value="CASE">CASE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Difficulty:
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Marks:
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={marks}
                    onChange={(e) => setMarks(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Usage:
                  </label>
                  <select
                    value={usage}
                    onChange={(e) => setUsage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="HW">HW</option>
                    <option value="CW">CW</option>
                    <option value="Exercise">Exercise</option>
                    <option value="Test">Test</option>
                    <option value="Compact">Compact</option>
                    <option value="Smart">Smart</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority (0-5):
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    value={priority}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setPriority(Math.min(5, Math.max(0, val)));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDownload}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Save Images
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Canvas Container */}
      <div className="flex-1 overflow-auto bg-gray-100 p-4">
        <div className="inline-block relative">
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onClick={handleCanvasClick}
            className="border border-gray-400 shadow-lg bg-white cursor-crosshair"
          />

          <div
            ref={overlayRef}
            className="absolute inset-0 pointer-events-none"
          >
            {selections
              .filter(s => s.pageNo === pageNo)
              .map(s => (
                <div
                  key={s.id}
                  onClick={() => onSelect(s)}
                  className="absolute cursor-pointer"
                  style={{
                    left: s.rectScreen.x,
                    top: s.rectScreen.y,
                    width: s.rectScreen.w,
                    height: s.rectScreen.h,
                    border: mode === "delete" && s.id === activeId
                      ? "3px solid red"
                      : s.id === activeSelection?.id
                        ? "3px solid #007bff"
                        : "2px dashed #00aaff",
                    background: "rgba(0,150,255,0.08)",
                    pointerEvents: "auto"
                  }}
                >
                  {activeSelection?.id === s.id && (
                    <>
                      {["nw", "n", "ne", "e", "se", "s", "sw", "w"].map(handle => (
                        <div
                          key={handle}
                          onMouseDown={(e) => startResize(e, s, handle)}
                          className="absolute w-2.5 h-2.5 bg-white border-2 border-blue-600 rounded pointer-events-auto"
                          style={{
                            cursor: `${handle}-resize`,
                            left: handle.includes("w")
                              ? -5
                              : handle.includes("e")
                                ? s.rectScreen.w - 5
                                : s.rectScreen.w / 2 - 5,
                            top: handle.includes("n")
                              ? -5
                              : handle.includes("s")
                                ? s.rectScreen.h - 5
                                : s.rectScreen.h / 2 - 5
                          }}
                        />
                      ))}
                    </>
                  )}
                </div>
              ))}

            {rect && (
              <div
                className="absolute border-2 border-dashed border-blue-500 bg-blue-100 bg-opacity-20 pointer-events-none"
                style={{
                  left: rect.x,
                  top: rect.y,
                  width: rect.w,
                  height: rect.h
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}