// Resume Parser - extracts text from PDF, DOC, and DOCX files

export async function parseResume(file) {
    const ext = file.name.split('.').pop().toLowerCase();

    if (ext === 'pdf') {
        return parsePDF(file);
    } else if (ext === 'docx' || ext === 'doc') {
        return parseDOCX(file);
    } else {
        throw new Error(`Unsupported file type: .${ext}. Please upload a .pdf, .doc, or .docx file.`);
    }
}

async function parsePDF(file) {
    const pdfjsLib = await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs');
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs';

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n';
    }

    return fullText.trim();
}

async function parseDOCX(file) {
    // mammoth is loaded globally via CDN
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value.trim();
}
