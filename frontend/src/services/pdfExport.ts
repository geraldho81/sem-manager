import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ExportOptions {
  filename?: string;
  quality?: number;
}

/**
 * Captures an HTML element and adds it as an image to a PDF
 */
async function captureElementToPdf(
  element: HTMLElement,
  pdf: jsPDF,
  pageNumber: number
): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
  });

  const imgData = canvas.toDataURL('image/png');
  const imgWidth = 210; // A4 width in mm
  const pageHeight = 297; // A4 height in mm
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  // Add new page if not the first page
  if (pageNumber > 0) {
    pdf.addPage();
  }

  // If content fits on one page
  if (imgHeight <= pageHeight) {
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
  } else {
    // Multi-page content
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
  }
}

/**
 * Exports all results tabs to a single PDF
 */
export async function exportResultsToPDF(
  options: ExportOptions = {}
): Promise<void> {
  const { filename = 'sem-analysis-results.pdf' } = options;

  // Show loading indicator
  const loadingDiv = document.createElement('div');
  loadingDiv.innerHTML = `
    <div style="
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    ">
      <div style="
        background: white;
        padding: 24px 32px;
        border-radius: 8px;
        text-align: center;
      ">
        <div style="
          width: 32px;
          height: 32px;
          border: 3px solid #e5e7eb;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 12px;
        "></div>
        <p style="margin: 0; color: #374151; font-size: 14px;">Generating PDF...</p>
      </div>
    </div>
    <style>
      @keyframes spin { to { transform: rotate(360deg); } }
    </style>
  `;
  document.body.appendChild(loadingDiv);

  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    let pageCount = 0;

    // Add cover page with title
    pdf.setFontSize(24);
    pdf.text('SEM Analysis Results', 105, 40, { align: 'center' });
    pdf.setFontSize(12);
    pdf.text(`Generated on ${new Date().toLocaleDateString()}`, 105, 55, { align: 'center' });
    
    // Add table of contents
    pdf.setFontSize(16);
    pdf.text('Contents', 20, 80);
    pdf.setFontSize(12);
    const sections = [
      '1. Research Summary',
      '2. Personas',
      '3. Keywords',
      '4. Strategy',
      '5. Responsive Search Ads (RSAs)',
    ];
    sections.forEach((section, i) => {
      pdf.text(section, 25, 95 + i * 10);
    });

    pageCount++;

    // Capture each tab's content
    const tabContents = [
      { id: 'research-tab-content', name: 'Research Summary' },
      { id: 'personas-tab-content', name: 'Personas' },
      { id: 'keywords-tab-content', name: 'Keywords' },
      { id: 'strategy-tab-content', name: 'Strategy' },
      { id: 'rsas-tab-content', name: 'RSAs' },
    ];

    for (const tab of tabContents) {
      const element = document.getElementById(tab.id);
      if (element) {
        // Add section header page
        pdf.addPage();
        pdf.setFontSize(20);
        pdf.text(tab.name, 105, 40, { align: 'center' });
        pageCount++;

        // Capture the content
        await captureElementToPdf(element, pdf, pageCount);
        pageCount++;
      }
    }

    pdf.save(filename);
  } finally {
    document.body.removeChild(loadingDiv);
  }
}

/**
 * Alternative: Export current visible content only
 */
export async function exportCurrentViewToPDF(
  elementId: string,
  options: ExportOptions = {}
): Promise<void> {
  const { filename = 'sem-results.pdf' } = options;

  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Element not found');
  }

  const loadingDiv = document.createElement('div');
  loadingDiv.innerHTML = `
    <div style="
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    ">
      <div style="
        background: white;
        padding: 24px 32px;
        border-radius: 8px;
      ">
        <p>Generating PDF...</p>
      </div>
    </div>
  `;
  document.body.appendChild(loadingDiv);

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(filename);
  } finally {
    document.body.removeChild(loadingDiv);
  }
}
