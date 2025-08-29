/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from "@google/genai";

// Simple state management
const appState = {
  profession: '',
  isLoading: false,
  error: null as string | null,
  generatedHtml: '',
  resumeImageUrl: '',
  editMode: false,
  loadingMessage: 'Crafting your resume...',
};

// Loading messages to cycle through
const loadingMessages = [
  "Drafting professional summary...",
  "Detailing work experience...",
  "Highlighting key skills...",
  "Searching for the perfect background...",
  "Designing the layout...",
  "Rendering high-quality preview...",
];
let messageInterval: number;


function App() {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

  const render = () => {
    const root = document.getElementById('root');
    if (!root) return;

    // Conditionally show/hide download buttons
    const downloadButtonVisibility = appState.editMode && appState.generatedHtml ? 'flex' : 'none';

    root.innerHTML = `
      <div class="app-container">
        <aside class="controls-panel">
          <h1>AI Resume Builder</h1>
          <div class="form-group">
            <label for="profession">Profession / Job Title</label>
            <input type="text" id="profession" placeholder="e.g., Senior Software Engineer" value="${appState.profession}">
          </div>
          <button id="generate-btn" class="btn btn-primary" ${appState.isLoading ? 'disabled' : ''}>
            ${appState.isLoading ? '<div class="spinner" style="width:20px;height:20px;border-width:3px;"></div> Generating...' : 'Generate Resume'}
          </button>
          <div class="download-buttons" style="display:${downloadButtonVisibility};">
             <button id="download-btn" class="btn">Download as PDF</button>
             <button id="download-word-btn" class="btn">Download as Word</button>
          </div>
          ${appState.error ? `<div class="error-message">${appState.error}</div>` : ''}
        </aside>
        <section class="resume-panel">
          ${renderOutput()}
        </section>
      </div>
    `;
    addEventListeners();
  };

  const renderOutput = () => {
    if (appState.isLoading) {
      return `
        <div class="loading-container">
          <div class="spinner"></div>
          <p id="loading-message" style="color:#555;">${appState.loadingMessage}</p>
        </div>
      `;
    }
    if (appState.resumeImageUrl && !appState.editMode) {
      return `
        <button id="edit-btn" class="btn">Edit Resume</button>
        <div class="resume-preview-container">
          <img id="resume-preview-image" src="${appState.resumeImageUrl}" alt="Resume Preview">
        </div>
      `;
    }
    if (appState.generatedHtml && appState.editMode) {
      return `<div id="resume-output">${appState.generatedHtml}</div>`;
    }
    return `<div id="resume-output"><p class="placeholder-text">Fill in the details and click 'Generate' to create your resume.</p></div>`;
  };

  const generateResumePreview = (html: string) => {
    const tempDiv = document.createElement('div');
    // Position off-screen but give it the dimensions of the final resume for accurate rendering
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.width = '8.5in'; 
    tempDiv.innerHTML = html;
    document.body.appendChild(tempDiv);
  
    // @ts-ignore - html2canvas is globally available
    html2canvas(tempDiv.firstElementChild as HTMLElement, { useCORS: true, scale: 2 })
      .then(canvas => {
        const imageUrl = canvas.toDataURL('image/png');
        setState({ resumeImageUrl: imageUrl, isLoading: false });
      })
      .catch(err => {
        console.error("Failed to generate image preview:", err);
        setState({ error: "Failed to render resume preview.", isLoading: false });
      })
      .finally(() => {
        document.body.removeChild(tempDiv);
      });
  };

  const handleGenerate = async () => {
    if (appState.isLoading) return;
    setState({ isLoading: true, error: null, generatedHtml: '', resumeImageUrl: '', editMode: false });
    
    // Cycle through loading messages
    let messageIndex = 0;
    messageInterval = window.setInterval(() => {
        messageIndex = (messageIndex + 1) % loadingMessages.length;
        const messageElement = document.getElementById('loading-message');
        if(messageElement) {
            messageElement.textContent = loadingMessages[messageIndex];
        }
    }, 2500);

    const prompt = `
        You are an expert resume designer and UI/UX developer. Your task is to generate a complete, single HTML document for a professional resume for a "${appState.profession}" with 10 years of experience.

        **Core Requirements:**
        - The entire output MUST be a single HTML string, starting with a container div: \`<div id="resume-content" ...>\`.
        - Use ONLY inline CSS for all styling (e.g., \`style="..."\`). DO NOT use \`<style>\` blocks or external stylesheets.
        - The design must be modern, professional, and visually compelling. Use your expertise to create a top-tier layout that best suits a senior professional.
        - Make all text elements (headings, paragraphs, list items) editable by adding the \`contenteditable="true"\` attribute.

        **Pagination Control for PDF Export:**
        - To ensure clean page breaks when the resume is exported to PDF, apply the following inline CSS styles:
        - For container divs of individual work experience entries, education entries, and project sections, add \`page-break-inside: avoid;\`. This prevents a single entry from being split across two pages.
        - For all section headings (like "Work Experience", "Skills", "Education"), add \`page-break-after: avoid;\` to the heading element itself (e.g., \`<h2>\`). This prevents a heading from appearing as the last item on a page.

        **Visual Enhancements (Background Image):**
        - Find a high-quality, professional, and **royalty-free** background image from a source like \`images.unsplash.com\` that is relevant to the profession: "${appState.profession}".
        - Apply this image to the main container's inline style.
        - **CRITICAL FOR READABILITY:** You MUST apply a semi-transparent overlay. For example, use a white overlay for dark text: \`background: linear-gradient(rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.92)), url('URL_HERE'); background-size: cover; background-position: center;\`.
        - The overall feel should remain professional and the background should be subtle, not distracting. Ensure high contrast between text and the background.

        **Content Requirements (Rich & Detailed for 10 years experience):**
        1.  **Header:** Name, Title. This section should have a distinct background color to separate it.
        2.  **Contact Info:** Email, Phone, LinkedIn with subtle icons.
        3.  **Professional Summary:** An engaging summary.
        4.  **Skills Section:** A well-organized list of relevant skills.
        5.  **Work Experience:** 3-4 past roles with company, dates, and 3-4 bullet points each highlighting quantifiable achievements.
        6.  **Education:** Degree, University, Graduation Date.

        Produce only the HTML for the resume content, ready to be rendered inside a div.
    `;
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              resumeHtml: {
                type: Type.STRING,
                description: "The complete, self-contained HTML for the resume."
              }
            }
          }
        }
      });
      
      const jsonResponse = JSON.parse(response.text);
      if (jsonResponse.resumeHtml) {
        setState({ generatedHtml: jsonResponse.resumeHtml });
        generateResumePreview(jsonResponse.resumeHtml); // Generate image and set loading to false inside
      } else {
        throw new Error("Received an invalid response structure from the AI.");
      }
    } catch (e) {
      console.error(e);
      setState({ error: `Failed to generate resume. Please try again. Error: ${(e as Error).message}`, isLoading: false });
    } finally {
      clearInterval(messageInterval);
    }
  };
  
  const handleDownload = () => {
    const resumeElement = document.getElementById('resume-content');
    if (!resumeElement) {
        setState({ error: "Could not find resume content to download." });
        return;
    }

    // Clone the element to modify for printing without affecting the screen view.
    const elementToPrint = resumeElement.cloneNode(true) as HTMLElement;
    
    // Remove styles that are for screen view (padding, border, shadow)
    // and let html2pdf control the page margins. This helps prevent extra blank space.
    elementToPrint.style.padding = '0';
    elementToPrint.style.border = 'none';
    elementToPrint.style.boxShadow = 'none';
    
    // Create a temporary container to hold the element for rendering.
    // This isolates it and ensures consistent sizing.
    const printContainer = document.createElement('div');
    printContainer.style.position = 'absolute';
    printContainer.style.left = '-9999px'; // Position off-screen
    printContainer.style.width = '8.5in'; // Set to paper width
    printContainer.appendChild(elementToPrint);
    document.body.appendChild(printContainer);

    const opt = {
      margin:       1, // Use 1 inch margins for the PDF
      filename:     `${appState.profession.replace(/\s+/g, '_')}_resume.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    
    // @ts-ignore - html2pdf is globally available from CDN
    const worker = html2pdf().from(elementToPrint).set(opt);
    
    worker.save().then(() => {
      document.body.removeChild(printContainer);
    }).catch((err: Error) => {
      console.error("PDF generation failed:", err);
      setState({ error: "Failed to generate PDF." });
      document.body.removeChild(printContainer);
    });
  };

  const handleDownloadWord = async () => {
    const downloadButton = document.getElementById('download-word-btn') as HTMLButtonElement;
    if (!downloadButton) return;
    
    const originalButtonText = downloadButton.textContent;
    downloadButton.textContent = 'Preparing...';
    downloadButton.disabled = true;

    try {
      const resumeElement = document.getElementById('resume-content');
      if (!resumeElement) {
          throw new Error("Could not find resume content to download.");
      }

      // Prepare the full HTML source string. html-docx-js works best with a complete document.
      const sourceHtml = `
        <!DOCTYPE html>
        <html>
        <head><meta charset='utf-8'><title>Resume</title></head>
        <body>${resumeElement.outerHTML}</body>
        </html>
      `;
      
      // @ts-ignore - htmlDocx is globally available from the CDN script
      if (!window.htmlDocx) {
        throw new Error("html-docx-js library not loaded. Please check the script tag in index.html.");
      }

      // Convert the HTML string to a Word document blob
      // @ts-ignore
      const fileBuffer = window.htmlDocx.asBlob(sourceHtml);

      // Use FileSaver.js to save the blob to a file
      // @ts-ignore - saveAs is globally available from the CDN script
      saveAs(fileBuffer, `${appState.profession.replace(/\s+/g, '_')}_resume.docx`);

    } catch (err) {
        console.error("Word generation failed:", err);
        setState({ error: `Failed to generate Word document: ${(err as Error).message}` });
    } finally {
      downloadButton.textContent = originalButtonText;
      downloadButton.disabled = false;
    }
  };

  const addEventListeners = () => {
    document.getElementById('profession')?.addEventListener('input', (e) => {
      appState.profession = (e.target as HTMLInputElement).value;
    });
    document.getElementById('generate-btn')?.addEventListener('click', handleGenerate);
    document.getElementById('download-btn')?.addEventListener('click', handleDownload);
    document.getElementById('download-word-btn')?.addEventListener('click', handleDownloadWord);
    document.getElementById('edit-btn')?.addEventListener('click', () => setState({ editMode: true }));
  };
  
  const setState = (newState: Partial<typeof appState>) => {
    Object.assign(appState, newState);
    render();
  };
  
  render();
}

App();