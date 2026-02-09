import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ExportOptions {
  filename?: string;
  results?: Record<string, any>;
  currency?: string;
}

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
          ${synthesis.key_insights.map((i: string) => `<li>${i}</li>`).join('')}
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
            ${synthesis.messaging_framework.supporting_messages.map((m: string) => `<li>${m}</li>`).join('')}
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
          <h3>${p.name}</h3>
          <p><strong>${p.age_range} | ${p.occupation}</strong></p>
          <p>${p.description}</p>
          
          ${p.goals?.length ? `
            <h4>Goals</h4>
            <ul>${p.goals.map((g: string) => `<li>${g}</li>`).join('')}</ul>
          ` : ''}
          
          ${p.frustrations?.length ? `
            <h4>Frustrations</h4>
            <ul>${p.frustrations.map((f: string) => `<li>${f}</li>`).join('')}</ul>
          ` : ''}
          
          ${p.sample_search_queries?.length ? `
            <h4>Search Queries</h4>
            <p>${p.sample_search_queries.join(', ')}</p>
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
        <h3>${c.cluster_name}</h3>
        <p><em>${c.theme}</em></p>
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
                <td>${k.keyword}</td>
                <td>${k.search_volume?.toLocaleString() || 'N/A'}</td>
                <td>${k.cpc ? `${currency} ${k.cpc}` : 'N/A'}</td>
                <td>${k.recommended_match_type}</td>
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
          <h3>${ag.name}</h3>
          <p><strong>Theme:</strong> ${ag.theme}</p>
          <p><strong>Target Persona:</strong> ${ag.target_persona}</p>
          <p><strong>Messaging Angle:</strong> ${ag.messaging_angle}</p>
          <p><strong>Suggested Bid:</strong> ${currency} ${ag.suggested_bid}</p>
          <p><strong>Keywords:</strong> ${ag.keywords?.join(', ')}</p>
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
          <h3>${rsa.ad_group_name}</h3>
          <p><strong>CPC Bid:</strong> ${rsa.currency} ${rsa.cpc_bid}</p>
          
          <h4>Headlines (15 max 30 chars)</h4>
          <ul>
            ${rsa.headlines.map((h: any) => `<li>${h.text} (${h.text.length} chars)</li>`).join('')}
          </ul>
          
          <h4>Descriptions (4 max 90 chars)</h4>
          <ul>
            ${rsa.descriptions.map((d: any) => `<li>${d.text} (${d.text.length} chars)</li>`).join('')}
          </ul>
        </div>
      `).join('')}
    </div>
  ` : '<div class="section"><h2>RSAs</h2><p>No RSAs available.</p></div>';

  return `
    <!DOCTYPE html>
    <html>
    <head>
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
        .section { margin-bottom: 40px; page-break-inside: avoid; }
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
          page-break-inside: avoid;
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
          page-break-after: always;
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

  // Create a temporary container
  const container = document.createElement('div');
  container.innerHTML = createResultsHTML(results, currency);
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '800px';
  document.body.appendChild(container);

  try {
    const element = container.querySelector('body') as HTMLElement;
    if (!element) {
      throw new Error('Could not create export element');
    }

    // Wait for fonts to load
    await document.fonts.ready;

    const canvas = await html2canvas(element, {
      scale: 1.5,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 800,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
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
    document.body.removeChild(container);
  }
}
