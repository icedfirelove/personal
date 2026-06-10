// ============================================================
// MilesVault — Client-side PDF text extraction
// Uses Mozilla's pdf.js, loaded on demand from CDN (only when
// the user actually imports a PDF — keeps the app bundle lean).
// The PDF itself never leaves the device; only the library
// code is fetched.
// ============================================================

const PDFJS_VERSION = '4.8.69';
const PDFJS_URL = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.mjs`;
const WORKER_URL = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.mjs`;

interface TextItem {
  str: string;
  transform: number[]; // [a,b,c,d,x,y]
}

interface PdfJsModule {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (opts: { data: ArrayBuffer }) => {
    promise: Promise<{
      numPages: number;
      getPage: (n: number) => Promise<{
        getTextContent: () => Promise<{ items: TextItem[] }>;
      }>;
    }>;
  };
}

let pdfjsPromise: Promise<PdfJsModule> | null = null;

function loadPdfJs(): Promise<PdfJsModule> {
  if (!pdfjsPromise) {
    // Function() keeps the URL import away from the bundler/TS resolver —
    // this is a genuine runtime dynamic import from CDN.
    pdfjsPromise = (Function('u', 'return import(u)')(PDFJS_URL) as Promise<PdfJsModule>).then(
      mod => {
        mod.GlobalWorkerOptions.workerSrc = WORKER_URL;
        return mod;
      },
    );
  }
  return pdfjsPromise;
}

/**
 * Extract text lines from a PDF, reconstructing rows by Y position
 * (pdf.js returns scattered text fragments with coordinates).
 */
export async function extractPdfLines(data: ArrayBuffer): Promise<string[]> {
  const pdfjs = await loadPdfJs();
  const doc = await pdfjs.getDocument({ data }).promise;
  const lines: string[] = [];

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();

    // Group fragments into rows by rounded Y, then order by X
    const rows = new Map<number, { x: number; str: string }[]>();
    for (const item of content.items) {
      if (!item.str || !item.str.trim()) continue;
      const x = item.transform[4];
      const y = Math.round(item.transform[5] / 3) * 3; // 3pt tolerance
      const row = rows.get(y) ?? [];
      row.push({ x, str: item.str });
      rows.set(y, row);
    }

    const sortedYs = [...rows.keys()].sort((a, b) => b - a); // top → bottom
    for (const y of sortedYs) {
      const line = rows
        .get(y)!
        .sort((a, b) => a.x - b.x)
        .map(f => f.str)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (line) lines.push(line);
    }
  }

  return lines;
}
