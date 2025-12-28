import { useState, useRef, useEffect } from "react";
import pdfjsLib from "../pdf/pdfConfig";

export default function PdfViewer({onCropCreate, onPageRender, selections, activeSelection}) {

  const canvasRef = useRef(null);
  const overlayRef = useRef(null);

  const [pdf, setPdf] = useState(null);
  const [pageNo, setPageNo] = useState(1);
  const [zoom, setZoom] = useState(1.5);
  const [mode, setMode] = useState("draw");
  const [activeId, setActiveId] = useState(null);
  const [resizing, setResizing] = useState(null);

  // crop state
  const [dragging, setDragging] = useState(false);
  const [rect, setRect] = useState(null);
  const startPos = useRef({ x: 0, y: 0 });
  const viewportRef = useRef(null);
  const pageRef = useRef(null);

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

    const onDelete = (selection) => {
        if (mode === "delete") {
            const updatedSelections = selections.filter(s => s.id !== selection.id);
            onCropCreate?.(updatedSelections);
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

    // --- RESIZE MODE ---
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

        // Prevent negative flip
        r.w = Math.max(10, r.w);
        r.h = Math.max(10, r.h);

        sel.rectScreen = r;
        onUpdateSelection?.(sel);
        return;
    }

    // --- DRAW MODE ---
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

    // ❌ reject overlapping selections
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

  const handleDelete = () => {
    if (!activeId) return;

    setSelections(prev =>
      prev.filter(sel => sel.id !== activeId)
    );

    setActiveId(null);
  };


return (
  <div>
        <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
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

            <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
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
            </div>

          <button onClick={() => setZoom(z => z + 0.25)}>Zoom +</button>
          <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}>Zoom -</button>
        </div>

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

      {/* The PDF canvas (REQUIRED for getContext) */}
      <canvas 
        ref={canvasRef} 
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />

      {/* Overlay layer for selections */}
      <div
        ref={overlayRef}
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "auto"
        }}
      >
        {/* Existing saved selections */}
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

            {/* 🟦 Show resize handles ONLY for active box */}
            {activeSelection?.id === s.id && (
                <>
                {["nw","n","ne","e","se","s","sw","w"].map(handle => (
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



        {/* Box currently being drawn */}
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

