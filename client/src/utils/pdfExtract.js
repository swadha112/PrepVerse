import * as pdfjsLib from "pdfjs-dist/build/pdf";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker?url";

// This sets the worker src for PDF.js (needed for Vite, React, etc)
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export async function extractPdfText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async function () {
      try {
        const typedarray = new Uint8Array(this.result);
        const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
        let text = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map(item => item.str).join(' ');
        }
        resolve(text);
      } catch (err) {
        console.error("pdfjs error:", err);
        reject(err);
      }
    };
    reader.onerror = (err) => {
      console.error("FileReader error:", err);
      reject(err);
    };
    reader.readAsArrayBuffer(file);
  });
}
