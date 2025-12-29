import { useState, useRef, useEffect } from "react";
import pdfjsLib from "../pdf/pdfConfig";
import { v4 as uuidv4 } from "uuid";
import { loadData } from "../data";

export default function PdfViewer({ clearAllSelection, onCropCreate, onPageRender, selections, activeSelection }) {

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

  // crop state
  const [dragging, setDragging] = useState(false);
  const [rect, setRect] = useState(null);
  const startPos = useRef({ x: 0, y: 0 });
  const viewportRef = useRef(null);
  const pageRef = useRef(null);

  // Store the folder handles
  let rootFolderHandle = null;
  let dbFolderHandle = null;

  // Load relation data
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

  // Filter chapters by selected class and subject
  const filteredChapters = chapters.filter(chapter => {
    const matchClass = !selectedClass || chapter.classId === selectedClass;
    const matchSubject = !selectedSubject || chapter.subjectId === selectedSubject;
    return matchClass && matchSubject;
  });

  // Filter concepts by selected chapter
  const filteredConcepts = concepts.filter(concept => {
    return !selectedChapter || concept.chapterId === selectedChapter;
  });

  const downloadSelectionsToFolder = async () => {
    if (!selections.length) {
      alert("No selections to download");
      return;
    }

    // Show modal for class/subject/concept selection
    setShowModal(true);
  };

  const confirmDownload = async () => {
    if (!selectedClass || !selectedSubject || !selectedChapter || !selectedConcept) {
      alert("Please select Class, Subject, Chapter, and Concept");
      return;
    }

    setShowModal(false);

    try {
      // If no folder selected yet, ask user to pick the root folder
      if (!rootFolderHandle) {
        rootFolderHandle = await window.showDirectoryPicker();
      }

      // Try to verify we still have access
      try {
        await rootFolderHandle.requestPermission({ mode: 'readwrite' });
      } catch (err) {
        rootFolderHandle = await window.showDirectoryPicker();
      }

      // Create or get 'db' folder
      dbFolderHandle = await rootFolderHandle.getDirectoryHandle('db', { create: true });

      // Read existing metadata if it exists
      let existingMetadata = [];
      try {
        const metadataHandle = await dbFolderHandle.getFileHandle('metadata.json');
        const file = await metadataHandle.getFile();
        const text = await file.text();
        existingMetadata = JSON.parse(text);
      } catch (err) {
        console.log('No existing metadata.json found in db folder, creating new one');
      }

      const newMetadata = [];

      for (let i = 0; i < selections.length; i++) {
        const sel = selections[i];

        // Get the page
        const page = await pdf.ref.getPage(sel.pageNo);

        const scale = 2;
        const viewport = page.getViewport({ scale });

        // Render full page
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');

        tempCanvas.width = viewport.width;
        tempCanvas.height = viewport.height;

        await page.render({
          canvasContext: tempCtx,
          viewport: viewport
        }).promise;

        // Create cropped canvas
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

        // Convert to blob
        const blob = await new Promise(resolve =>
          croppedCanvas.toBlob(resolve, 'image/png')
        );

        // Use UUID for filename
        const imageUuid = sel.id || uuidv4();
        const filename = `${imageUuid}.png`;

        // Write image file to db folder
        const fileHandle = await dbFolderHandle.getFileHandle(filename, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();

        // Add to new metadata with relations
        newMetadata.push({
          id: imageUuid,
          filename: filename,
          filepath: `./db/${filename}`,
          pageNo: sel.pageNo,
          type: sel.type,
          status: sel.status,
          rectPdf: sel.rectPdf,
          rectScreen: sel.rectScreen,
          classId: selectedClass,
          subjectId: selectedSubject,
          chapterId: selectedChapter,
          conceptId: selectedConcept,
          meta: sel.meta,
          timestamp: new Date().toISOString()
        });
      }

      // Concatenate with existing metadata
      const combinedMetadata = [...existingMetadata, ...newMetadata];

      // Write updated metadata.json to db folder
      const metadataJson = JSON.stringify(combinedMetadata, null, 2);
      const metadataBlob = new Blob([metadataJson], { type: 'application/json' });

      const metadataHandle = await dbFolderHandle.getFileHandle('metadata.json', { create: true });
      const metadataWritable = await metadataHandle.createWritable();
      await metadataWritable.write(metadataBlob);
      await metadataWritable.close();

      alert(`✅ Saved ${selections.length} new images to db folder. Total: ${combinedMetadata.length} images`);

      // Reset selections
      setSelectedClass('');
      setSelectedSubject('');
      setSelectedChapter('');
      setSelectedConcept('');

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

    setPdf({
      ref: loaded,
      name: file.name
    });

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

    startPos.current = {
      x: e.clientX - bounds.left,
      y: e.clientY - bounds.top
    };

    setRect(null);
    setDragging(true);
  };

  const hitTest = (x, y) => {
    return selections.find(sel =>
      x >= sel.x &&
      x <= sel.x + sel.w &&
      y >= sel.y &&
      y <= sel.y + sel.h
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
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
        <button onClick={openPdf}>Open PDF</button>

        <button disabled={!pdf || pageNo === 1}
          onClick={() => setPageNo(p => p - 1)}>
          ◀ Prev
        </button>

        <span>
          Page {pageNo} / {pdf?.ref?.numPages || "--"}
        </span>

        <button disabled={!pdf || pageNo === pdf?.ref?.numPages}
          onClick={() => setPageNo(p => p + 1)}>
          Next ▶
        </button>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setMode("draw")}
            style={{
              border: mode === "draw" ? "2px solid #007bff" : "1px solid #ccc"
            }}
          >
            Draw
          </button>

          <button
            onClick={() => setMode("select")}
            style={{
              border: mode === "select" ? "2px solid #007bff" : "1px solid #ccc"
            }}
          >
            🖱 Select/Edit
          </button>

          <button
            onClick={() => setMode("delete")}
            style={{
              border: mode === "delete" ? "2px solid #007bff" : "1px solid #ccc"
            }}
          >
            🗑 Delete
          </button>
          <button onClick={downloadSelectionsToFolder} disabled={!selections.length}>
            💾 Download All Selections
          </button>
        </div>

        <button onClick={() => setZoom(z => z + 0.25)}>Zoom +</button>
        <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}>Zoom -</button>
      </div>

      {/* Modal for selecting class, subject, chapter, concept */}
      {showModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "white",
            padding: 24,
            borderRadius: 8,
            minWidth: 400,
            maxWidth: 600
          }}>
            <h2 style={{ marginBottom: 16 }}>Select Relations for Images</h2>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>Class:</label>
              <select
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setSelectedChapter('');
                  setSelectedConcept('');
                }}
                style={{ width: "100%", padding: 8, border: "1px solid #ccc", borderRadius: 4 }}
              >
                <option value="">Select Class</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>Subject:</label>
              <select
                value={selectedSubject}
                onChange={(e) => {
                  setSelectedSubject(e.target.value);
                  setSelectedChapter('');
                  setSelectedConcept('');
                }}
                style={{ width: "100%", padding: 8, border: "1px solid #ccc", borderRadius: 4 }}
              >
                <option value="">Select Subject</option>
                {subjects.map(subj => (
                  <option key={subj.id} value={subj.id}>{subj.name}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>Chapter:</label>
              <select
                value={selectedChapter}
                onChange={(e) => {
                  setSelectedChapter(e.target.value);
                  setSelectedConcept('');
                }}
                disabled={!selectedClass || !selectedSubject}
                style={{ width: "100%", padding: 8, border: "1px solid #ccc", borderRadius: 4 }}
              >
                <option value="">Select Chapter</option>
                {filteredChapters.map(chap => (
                  <option key={chap.id} value={chap.id}>{chap.name}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>Concept:</label>
              <select
                value={selectedConcept}
                onChange={(e) => setSelectedConcept(e.target.value)}
                disabled={!selectedChapter}
                style={{ width: "100%", padding: 8, border: "1px solid #ccc", borderRadius: 4 }}
              >
                <option value="">Select Concept</option>
                {filteredConcepts.map(concept => (
                  <option key={concept.id} value={concept.id}>{concept.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowModal(false)}
                style={{ padding: "8px 16px", border: "1px solid #ccc", borderRadius: 4, background: "#f5f5f5" }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDownload}
                style={{ padding: "8px 16px", border: "none", borderRadius: 4, background: "#007bff", color: "white" }}
              >
                Save Images
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAGE + OVERLAY CONTAINER */}
      <div
        style={{
          position: "relative",
          display: "inline-block",
          border: "1px solid #ddd"
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        />

        <div
          ref={overlayRef}
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "auto"
          }}
        >
          {selections
            .filter(s => s.pageNo === pageNo)
            .map(s => (
              <div
                key={s.id}
                onClick={() => onSelect(s)}
                style={{
                  position: "absolute",
                  left: s.rectScreen.x,
                  top: s.rectScreen.y,
                  width: s.rectScreen.w,
                  height: s.rectScreen.h,
                  border:
                    mode === "delete" && s.id === activeId
                      ? "3px solid red"
                      : s.id === activeSelection?.id
                        ? "3px solid #007bff"
                        : "2px dashed #00aaff",
                  background: "rgba(0,150,255,0.08)",
                  cursor: "pointer"
                }}
              >
                {activeSelection?.id === s.id && (
                  <>
                    {["nw", "n", "ne", "e", "se", "s", "sw", "w"].map(handle => (
                      <div
                        key={handle}
                        data-handle={handle}
                        onMouseDown={(e) => startResize(e, s, handle)}
                        style={{
                          position: "absolute",
                          width: 10,
                          height: 10,
                          background: "#fff",
                          border: "2px solid #007bff",
                          borderRadius: 4,
                          cursor: `${handle}-resize`,
                          left:
                            handle.includes("w") ? -5 :
                              handle.includes("e") ? s.rectScreen.w - 5 :
                                s.rectScreen.w / 2 - 5,
                          top:
                            handle.includes("n") ? -5 :
                              handle.includes("s") ? s.rectScreen.h - 5 :
                                s.rectScreen.h / 2 - 5
                        }}
                      />
                    ))}
                  </>
                )}
              </div>
            ))}

          {rect && (
            <div
              style={{
                position: "absolute",
                left: rect.x,
                top: rect.y,
                width: rect.w,
                height: rect.h,
                border: "2px solid #00aaff",
                background: "rgba(0,150,255,0.15)"
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}