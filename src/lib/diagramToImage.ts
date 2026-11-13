import mermaid from 'mermaid';

export interface RenderedDiagram {
  dataUrl: string;
  widthPx: number;
  heightPx: number;
  aspectRatio: number;
}

/**
 * Initializes Mermaid configuration for export rendering with crisp, high-contrast academic colors
 */
function initializeMermaidForPdf(): void {
  try {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      fontFamily: 'Helvetica, Arial, sans-serif',
      flowchart: {
        useMaxWidth: false,
        htmlLabels: true,
        curve: 'basis',
      },
      themeVariables: {
        primaryColor: '#eef2ff', // Indigo 50
        primaryTextColor: '#0f172a', // Slate 900
        primaryBorderColor: '#6366f1', // Indigo 500
        lineColor: '#475569', // Slate 600
        secondaryColor: '#f1f5f9', // Slate 100
        tertiaryColor: '#ffffff',
        edgeLabelBackground: '#ffffff',
      },
    });
  } catch (err) {
    console.warn('Mermaid initialize warning:', err);
  }
}

/**
 * Renders an SVG string onto an HTML5 canvas and converts it into a high-DPI (retina) PNG Data URL.
 * Automatically ensures a clean, solid white background and proper scaling.
 */
export async function svgToPngDataUrl(svgString: string): Promise<RenderedDiagram> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('svgToPngDataUrl can only be executed in a browser environment'));
    }

    try {
      // Parse SVG dimensions or viewBox
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
      const svgEl = svgDoc.documentElement;

      let width = parseFloat(svgEl.getAttribute('width') || '0');
      let height = parseFloat(svgEl.getAttribute('height') || '0');

      const viewBox = svgEl.getAttribute('viewBox');
      if (viewBox) {
        const parts = viewBox.split(/[\s,]+/).map(parseFloat);
        if (parts.length === 4 && (!width || !height || isNaN(width) || isNaN(height))) {
          width = parts[2];
          height = parts[3];
        }
      }

      // Sensible fallbacks
      if (!width || isNaN(width) || width <= 0) width = 650;
      if (!height || isNaN(height) || height <= 0) height = 320;

      // Ensure explicit width/height/xmlns on root svg
      svgEl.setAttribute('width', `${width}px`);
      svgEl.setAttribute('height', `${height}px`);
      if (!svgEl.getAttribute('xmlns')) {
        svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      }

      const serializedSvg = new XMLSerializer().serializeToString(svgEl);
      const svgBlob = new Blob([serializedSvg], { type: 'image/svg+xml;charset=utf-8' });
      const URLObj = window.URL || window.webkitURL || window;
      const blobUrl = URLObj.createObjectURL(svgBlob);

      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          // Render at 2x resolution for publication-quality sharpness
          const pixelRatio = 2;
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(width * pixelRatio);
          canvas.height = Math.round(height * pixelRatio);

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            URLObj.revokeObjectURL(blobUrl);
            return reject(new Error('Canvas 2D context unavailable'));
          }

          // Solid clean white background
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Draw scaled high-res SVG image
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const dataUrl = canvas.toDataURL('image/png', 1.0);
          URLObj.revokeObjectURL(blobUrl);

          resolve({
            dataUrl,
            widthPx: canvas.width,
            heightPx: canvas.height,
            aspectRatio: width / height,
          });
        } catch (drawErr) {
          URLObj.revokeObjectURL(blobUrl);
          reject(drawErr);
        }
      };

      img.onerror = (imgErr) => {
        URLObj.revokeObjectURL(blobUrl);
        reject(new Error(`Failed to load SVG into image: ${imgErr}`));
      };

      img.src = blobUrl;
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Converts a Mermaid diagram definition string into a high-resolution PNG image Data URL.
 */
export async function renderMermaidToPngDataUrl(mermaidCode: string): Promise<RenderedDiagram | null> {
  if (typeof window === 'undefined') return null;
  if (!mermaidCode || !mermaidCode.trim()) return null;

  initializeMermaidForPdf();

  const cleanCode = mermaidCode
    .trim()
    .replace(/^```mermaid\s*/i, '')
    .replace(/^```\s*/, '')
    .replace(/```$/g, '')
    .trim();

  if (!cleanCode) return null;

  try {
    const uniqueId = `pdf-mermaid-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const { svg } = await mermaid.render(uniqueId, cleanCode);

    if (!svg) return null;
    return await svgToPngDataUrl(svg);
  } catch (err) {
    console.warn('Failed to render Mermaid diagram to PNG for PDF:', err);
    return null;
  }
}
