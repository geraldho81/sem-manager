import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ExportOptions {
  filename?: string;
  results?: Record<string, any>;
  currency?: string;
}

// Maximum canvas height to avoid browser limits (Chrome ~32,767px)
const MAX_CANVAS_HEIGHT = 16000;
const PAGE_HEIGHT_MM = 297; // A4 height in mm
const PAGE_WIDTH_MM = 210; // A4 width in mm

/**
 * Creates a simple HTML representation of the results for PDF export
 */
function createResultsHTML(results: Record<string, any>, currency: string): string {
  const synthesis = results?.synthesis || {};
  const personas = results?.persona_research?.personas || [];
  const keywords = results?.keyword_research || {};
  const strategy = results?.strategy || {};
  const rsas = results?.rsas?.ad_group_rsas || [];

  // Research Summary Section
  const researchSection = `
    <div class="section">
      <h2>Research Summary</h2>
      <h3>Executive Summary</h3>
      <p>${synthesis.executive_summary || 'No summary available.'}</p>
      
      ${synthesis.key_insights?.length ? `
        <h3>Key Insights</h3>
        <ul>
          ${synthesis.key_insights.map((i: string) => `<li>${escapeHtml(i)}</li>`).join('')}
        </ul>
      ` : ''}
      
      ${synthesis.competitive_positioning ? `
        <h3>Competitive Positioning</h3>
        <p>${synthesis.competitive_positioning}</p>
      ` : ''}
      
      ${synthesis.messaging_framework?.primary_message ? `
        <h3>Messaging Framework</h3>
        <div class="highlight">
          <strong>Primary Message:</strong> ${synthesis.messaging_framework.primary_message}
        </div>
        ${synthesis.messaging_framework.supporting_messages?.length ? `
          <p><strong>Supporting Messages:</strong></p>
          <ul>
            ${synthesis.messaging_framework.supporting_messages.map((m: string) => `<li>${escapeHtml(m)}</li>`).join('')}
          </ul>
        ` : ''}
      ` : ''}
    </div>
  `;

  // Personas Section
  const personasSection = personas.length ? `
    <div class="section">
      <h2>Personas</h2>
      ${personas.map((p: any) => `
        <div class="persona-card">
          <h3>${escapeHtml(p.name)}</h3>
          <p><strong>${escapeHtml(p.age_range)} | ${escapeHtml(p.occupation)}</strong></p>
          <p>${p.description}</p>
          
          ${p.goals?.length ? `
            <h4>Goals</h4>
            <ul>${p.goals.map((g: string) => `<li>${escapeHtml(g)}</li>`).join('')}</ul>
          ` : ''}
          
          ${p.frustrations?.length ? `
            <h4>Frustrations</h4>
            <ul>${p.frustrations.map((f: string) => `<li>${escapeHtml(f)}</li>`).join('')}</ul>
          ` : ''}
          
          ${p.sample_search_queries?.length ? `
            <h4>Search Queries</h4>
            <p>${p.sample_search_queries.map((q: string) => escapeHtml(q)).join(', ')}</p>
          ` : ''}
        </div>
      `).join('')}
    </div>
  ` : '<div class="section"><h2>Personas</h2><p>No personas available.</p></div>';

  // Keywords Section
  const clusters = keywords.clusters || [];
  const keywordsSection = clusters.length ? `
    <div class="section">
      <h2>Keywords</h2>
      ${clusters.map((c: any) => `
        <h3>${escapeHtml(c.cluster_name)}</h3>
        <p><em>${escapeHtml(c.theme)}</em></p>
        <table>
          <thead>
            <tr>
              <th>Keyword</th>
              <th>Volume</th>
              <th>CPC (${currency})</th>
              <th>Match Type</th>
            </tr>
          </thead>
          <tbody>
            ${c.keywords.map((k: any) => `
              <tr>
                <td>${escapeHtml(k.keyword)}</td>
                <td>${k.search_volume?.toLocaleString() || 'N/A'}</td>
                <td>${k.cpc ? `${currency} ${k.cpc}` : 'N/A'}</td>
                <td>${k.recommended_match_type || 'N/A'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `).join('')}
    </div>
  ` : '<div class="section"><h2>Keywords</h2><p>No keywords available.</p></div>';

  // Strategy Section
  const adGroups = strategy.ad_groups || [];
  const strategySection = adGroups.length ? `
    <div class="section">
      <h2>Strategy</h2>
      ${adGroups.map((ag: any) => `
        <div class="strategy-card">
          <h3>${escapeHtml(ag.name)}</h3>
          <p><strong>Theme:</strong> ${escapeHtml(ag.theme)}</p>
          <p><strong>Target Persona:</strong> ${escapeHtml(ag.target_persona)}</p>
          <p><strong>Messaging Angle:</strong> ${escapeHtml(ag.messaging_angle)}</p>
          <p><strong>Suggested Bid:</strong> ${currency} ${ag.suggested_bid}</p>
          <p><strong>Keywords:</strong> ${ag.keywords?.map((k: string) => escapeHtml(k)).join(', ')}</p>
        </div>
      `).join('')}
    </div>
  ` : '<div class="section"><h2>Strategy</h2><p>No strategy available.</p></div>';

  // RSAs Section
  const rsasSection = rsas.length ? `
    <div class="section">
      <h2>Responsive Search Ads (RSAs)</h2>
      ${rsas.map((rsa: any) => `
        <div class="rsa-card">
          <h3>${escapeHtml(rsa.ad_group_name)}</h3>
          <p><strong>CPC Bid:</strong> ${rsa.currency} ${rsa.cpc_bid}</p>
          
          <h4>Headlines (15 max 30 chars)</h4>
          <ul>
            ${rsa.headlines.map((h: any) => `<li>${escapeHtml(h.text)} (${h.text.length} chars)</li>`).join('')}
          </ul>
          
          <h4>Descriptions (4 max 90 chars)</h4>
          <ul>
            ${rsa.descriptions.map((d: any) => `<li>${escapeHtml(d.text)} (${d.text.length} chars)</li>`).join('')}
          </ul>
        </div>
      `).join('')}
    </div>
  ` : '<div class="section"><h2>RSAs</h2><p>No RSAs available.</p></div>';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { box-sizing: border-box; }
        body { 
          font-family: Arial, sans-serif; 
          line-height: 1.6; 
          color: #333;
          padding: 20px;
          max-width: 800px;
          margin: 0 auto;
        }
        h1 { color: #2563eb; text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 10px; }
        h2 { color: #2563eb; margin-top: 30px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; }
        h3 { color: #374151; margin-top: 20px; }
        h4 { color: #6b7280; margin-top: 15px; }
        .section { margin-bottom: 40px; }
        .highlight { 
          background: #eff6ff; 
          border-left: 4px solid #2563eb; 
          padding: 15px; 
          margin: 15px 0;
        }
        .persona-card, .strategy-card, .rsa-card {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
          margin: 15px 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
          font-size: 14px;
        }
        th, td {
          border: 1px solid #e5e7eb;
          padding: 10px;
          text-align: left;
        }
        th {
          background: #f9fafb;
          font-weight: bold;
        }
        tr:nth-child(even) {
          background: #f9fafb;
        }
        ul {
          margin: 10px 0;
          padding-left: 25px;
        }
        li {
          margin: 5px 0;
        }
        p {
          margin: 10px 0;
        }
        .cover {
          text-align: center;
          padding: 100px 20px;
        }
        .cover h1 {
          font-size: 36px;
          margin-bottom: 20px;
          border: none;
        }
        .cover p {
          color: #6b7280;
          font-size: 16px;
        }
        .toc {
          page-break-after: always;
        }
        .toc h2 {
          text-align: center;
        }
        .toc ul {
          list-style: none;
          padding: 0;
          max-width: 400px;
          margin: 30px auto;
        }
        .toc li {
          padding: 10px 0;
          border-bottom: 1px solid #e5e7eb;
        }
      </style>
    </head>
    <body>
      <div class="cover">
        <h1>SEM Analysis Results</h1>
        <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
      </div>
      
      <div class="toc">
        <h2>Contents</h2>
        <ul>
          <li>1. Research Summary</li>
          <li>2. Personas</li>
          <li>3. Keywords</li>
          <li>4. Strategy</li>
          <li>5. Responsive Search Ads (RSAs)</li>
        </ul>
      </div>
      
      ${researchSection}
      ${personasSection}
      ${keywordsSection}
      ${strategySection}
      ${rsasSection}
    </body>
    </html>
  `;
}

/**
 * Escape HTML special characters to prevent XSS and rendering issues
 */
function escapeHtml(text: string): string {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Split content into chunks that fit within canvas limits
 */
function splitContentIntoChunks(container: HTMLElement, maxHeight: number): HTMLElement[] {
  const chunks: HTMLElement[] = [];
  const sections = Array.from(container.querySelectorAll('.section, .cover, .toc'));
  
  let currentChunk = document.createElement('div');
  currentChunk.style.cssText = container.style.cssText;
  let currentHeight = 0;
  
  for (const section of sections) {
    const sectionHeight = (section as HTMLElement).offsetHeight;
    
    // If single section is too large, we need to include it anyway
    // html2canvas will handle it as best it can
    if (currentHeight + sectionHeight > maxHeight && currentHeight > 0) {
      chunks.push(currentChunk);
      currentChunk = document.createElement('div');
      currentChunk.style.cssText = container.style.cssText;
      currentHeight = 0;
    }
    
    currentChunk.appendChild(section.cloneNode(true));
    currentHeight += sectionHeight;
  }
  
  if (currentChunk.childNodes.length > 0) {
    chunks.push(currentChunk);
  }
  
  return chunks.length > 0 ? chunks : [container];
}

/**
 * Wait for fonts to be loaded with timeout
 */
async function waitForFonts(timeoutMs = 5000): Promise<void> {
  if (!document.fonts) return;
  
  try {
    await Promise.race([
      document.fonts.ready,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Font loading timeout')), timeoutMs)
      )
    ]);
  } catch (e) {
    console.warn('Font loading issue, continuing anyway:', e);
  }
}

/**
 * Convert a canvas to an image with error handling
 */
async function canvasToImage(canvas: HTMLCanvasElement): Promise<string> {
  try {
    // Check if canvas is empty or too large
    if (canvas.width === 0 || canvas.height === 0) {
      throw new Error('Canvas has zero dimensions');
    }
    
    // Try PNG first, fallback to JPEG if too large
    let dataUrl = canvas.toDataURL('image/png');
    
    // If PNG is too large, try JPEG with compression
    if (dataUrl.length > 5 * 1024 * 1024) { // 5MB limit per image
      console.log('PNG too large, using JPEG compression');
      dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    }
    
    return dataUrl;
  } catch (e) {
    console.error('Canvas to image conversion failed:', e);
    throw new Error(`Failed to convert canvas to image: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }
}

/**
 * Renders a single chunk to canvas and adds to PDF
 */
async function renderChunkToPDF(
  chunk: HTMLElement,
  pdf: jsPDF,
  isFirstPage: boolean,
  scale: number
): Promise<void> {
  // Temporarily add to body for rendering
  chunk.style.position = 'absolute';
  chunk.style.left = '-9999px';
  chunk.style.top = '0';
  chunk.style.width = '800px';
  document.body.appendChild(chunk);
  
  try {
    const canvas = await html2canvas(chunk, {
      scale: scale,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 800,
      imageTimeout: 15000,
      onclone: (clonedDoc) => {
        // Ensure cloned document has proper styling
        const clonedBody = clonedDoc.body;
        clonedBody.style.margin = '0';
        clonedBody.style.padding = '0';
      }
    });
    
    const imgData = await canvasToImage(canvas);
    const imgWidth = PAGE_WIDTH_MM;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Calculate how many pages this chunk needs
    let heightLeft = imgHeight;
    let position = 0;
    
    // Add new page if not the first element
    if (!isFirstPage) {
      pdf.addPage();
    }
    
    // Add image to PDF, splitting across pages if necessary
    while (heightLeft > 0) {
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= PAGE_HEIGHT_MM;
      
      if (heightLeft > 0) {
        pdf.addPage();
        position = -PAGE_HEIGHT_MM * (Math.floor((imgHeight - heightLeft) / PAGE_HEIGHT_MM) + 1);
      }
    }
  } finally {
    document.body.removeChild(chunk);
  }
}

/**
 * Exports all results to a single PDF using html2canvas
 */
export async function exportResultsToPDF(
  options: ExportOptions = {}
): Promise<void> {
  const { 
    filename = 'sem-analysis-results.pdf',
    results = {},
    currency = 'USD'
  } = options;

  // Validate inputs
  if (!results || Object.keys(results).length === 0) {
    throw new Error('No results data provided for PDF export');
  }

  // Create a temporary container
  const container = document.createElement('div');
  container.innerHTML = createResultsHTML(results, currency);
  
  // Set styles for proper rendering
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '800px';
  container.style.backgroundColor = '#ffffff';
  document.body.appendChild(container);

  try {
    // Wait for fonts to load
    await waitForFonts(5000);
    
    // Give the browser a moment to render
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Calculate appropriate scale based on content length
    const contentHeight = container.offsetHeight;
    let scale = 1.5;
    
    // Reduce scale for very large content to avoid canvas size limits
    if (contentHeight > 5000) {
      scale = 1.2;
    } else if (contentHeight > 10000) {
      scale = 1.0;
    }
    
    console.log(`PDF Export: Content height ${contentHeight}px, using scale ${scale}`);
    
    // Initialize PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Split content into manageable chunks
    const element = container.querySelector('body') as HTMLElement;
    if (!element) {
      throw new Error('Could not find body element in export container');
    }
    
    const chunks = splitContentIntoChunks(element, MAX_CANVAS_HEIGHT);
    console.log(`PDF Export: Split content into ${chunks.length} chunk(s)`);
    
    // Render each chunk
    for (let i = 0; i < chunks.length; i++) {
      await renderChunkToPDF(chunks[i], pdf, i === 0, scale);
    }
    
    // Save the PDF
    pdf.save(filename);
    console.log('PDF Export: Successfully saved', filename);
    
  } catch (error) {
    console.error('PDF export error:', error);
    throw new Error(`PDF export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    // Clean up
    if (container.parentNode) {
      document.body.removeChild(container);
    }
  }
}
