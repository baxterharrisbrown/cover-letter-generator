// DOCX Generator - creates a Word document matching the cover letter template

let docxLib = null;
async function loadDocx() {
    if (!docxLib) {
        docxLib = await import('https://cdn.jsdelivr.net/npm/docx@9.5.0/+esm');
    }
    return docxLib;
}

export async function generateDOCX(data) {
    const { Document, Packer, Paragraph, TextRun, AlignmentType,
        ExternalHyperlink, BorderStyle } = await loadDocx();
    const today = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Determine the greeting recipient
    const greetingRecipient = `${data.companyName} Recruiting Team`;

    // Parse the body text into paragraphs
    const bodyParagraphs = data.coverLetterBody
        .split(/\n\n+/)
        .filter(p => p.trim())
        .map((text, index) => new Paragraph({
            spacing: { before: 240 },
            indent: { left: 0, right: 0, firstLine: index === 0 ? 720 : 720 },
            children: [
                new TextRun({
                    text: text.trim(),
                    font: 'Cambria',
                    size: 20 // 10pt
                })
            ]
        }));

    // Format LinkedIn display text (strip protocol)
    const linkedinDisplay = data.linkedin
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '');

    const doc = new Document({
        sections: [{
            properties: {
                page: {
                    size: { width: 12240, height: 15840 },
                    margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
                }
            },
            children: [
                // === HEADER: Name (right-aligned) ===
                new Paragraph({
                    spacing: { after: 0, line: 259, lineRule: 'auto' },
                    indent: { left: 0, right: 4 },
                    alignment: AlignmentType.RIGHT,
                    children: [
                        new TextRun({
                            text: data.userName,
                            font: 'Cambria',
                            size: 22 // 11pt
                        })
                    ]
                }),

                // === Address ===
                new Paragraph({
                    spacing: { after: 0, line: 294, lineRule: 'auto' },
                    alignment: AlignmentType.RIGHT,
                    children: [
                        new TextRun({
                            text: data.address,
                            font: 'Cambria',
                            size: 20
                        })
                    ]
                }),

                // === Phone ===
                new Paragraph({
                    spacing: { after: 0, line: 294, lineRule: 'auto' },
                    alignment: AlignmentType.RIGHT,
                    children: [
                        new TextRun({
                            text: data.phone,
                            font: 'Cambria',
                            size: 20
                        })
                    ]
                }),

                // === Email ===
                new Paragraph({
                    spacing: { after: 0, line: 294, lineRule: 'auto' },
                    alignment: AlignmentType.RIGHT,
                    children: [
                        new TextRun({
                            text: data.email,
                            font: 'Cambria',
                            size: 20
                        })
                    ]
                }),

                // === LinkedIn ===
                new Paragraph({
                    spacing: { after: 0, line: 294, lineRule: 'auto' },
                    alignment: AlignmentType.RIGHT,
                    children: [
                        new ExternalHyperlink({
                            children: [
                                new TextRun({
                                    text: linkedinDisplay,
                                    font: 'Cambria',
                                    size: 20,
                                    style: 'Hyperlink'
                                })
                            ],
                            link: data.linkedin.startsWith('http') ? data.linkedin : `https://${data.linkedin}`
                        })
                    ]
                }),

                // === Horizontal Line ===
                new Paragraph({
                    spacing: { after: 283, line: 259, lineRule: 'auto' },
                    indent: { left: -29, right: -28 },
                    border: {
                        bottom: {
                            style: BorderStyle.SINGLE,
                            size: 6,
                            color: '000000',
                            space: 1
                        }
                    },
                    children: []
                }),

                // === Date ===
                new Paragraph({
                    indent: { left: 0, right: 0 },
                    alignment: AlignmentType.LEFT,
                    children: [
                        new TextRun({
                            text: today,
                            font: 'Cambria',
                            size: 20
                        })
                    ]
                }),

                // === Recruiting Team ===
                new Paragraph({
                    spacing: { after: 0 },
                    indent: { left: 0, right: 0 },
                    alignment: AlignmentType.LEFT,
                    children: [
                        new TextRun({
                            text: `${data.companyName} Recruiting Team`,
                            font: 'Cambria',
                            size: 20
                        })
                    ]
                }),

                // === Company Name ===
                new Paragraph({
                    spacing: { after: 0 },
                    indent: { left: 0, right: 0 },
                    alignment: AlignmentType.LEFT,
                    children: [
                        new TextRun({
                            text: data.companyName,
                            font: 'Cambria',
                            size: 20
                        })
                    ]
                }),

                // === Re: Job Title ===
                new Paragraph({
                    spacing: { after: 0 },
                    indent: { left: 0, right: 0 },
                    alignment: AlignmentType.LEFT,
                    children: [
                        new TextRun({
                            text: `Re: ${data.jobTitle}`,
                            font: 'Cambria',
                            size: 20
                        })
                    ]
                }),

                // === Dear Greeting ===
                new Paragraph({
                    spacing: { before: 240 },
                    indent: { left: 0, right: 0 },
                    children: [
                        new TextRun({
                            text: `Dear ${greetingRecipient},`,
                            font: 'Cambria',
                            size: 20
                        })
                    ]
                }),

                // === Body Paragraphs ===
                ...bodyParagraphs,

                // === Sincerely ===
                new Paragraph({
                    spacing: { before: 240, after: 534 },
                    indent: { left: 0, right: 0 },
                    children: [
                        new TextRun({
                            text: 'Sincerely,',
                            font: 'Cambria',
                            size: 20
                        })
                    ]
                }),

                // === Signature Name ===
                new Paragraph({
                    spacing: { before: 240 },
                    indent: { left: 0, right: 0 },
                    children: [
                        new TextRun({
                            text: data.userName,
                            font: 'Cambria',
                            size: 20
                        })
                    ]
                })
            ]
        }]
    });

    const buffer = await Packer.toBlob(doc);
    return buffer;
}
