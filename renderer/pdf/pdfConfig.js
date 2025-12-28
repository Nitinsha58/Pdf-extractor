import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf/pdf.worker.mjs";

export default pdfjsLib;
