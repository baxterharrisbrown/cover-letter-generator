// Main Application - orchestrates form, AI service, and DOCX generation

import { parseResume } from './resume-parser.js';
import { generateCoverLetter } from './ai-service.js';
import { generateDOCX } from './docx-generator.js';

// State
let resumeFile = null;
let resumeText = '';
let generatedBody = '';
let currentMode = 'free'; // 'free' or 'own-key'

// DOM Elements
const $ = id => document.getElementById(id);

const modeFreeBtn = $('mode-free');
const modeOwnKeyBtn = $('mode-own-key');
const freeModeInfo = $('free-mode-info');
const ownKeyFields = $('own-key-fields');
const apiProvider = $('api-provider');
const apiKey = $('api-key');
const toggleKeyBtn = $('toggle-key-visibility');
const resumeUpload = $('resume-upload');
const resumeDropZone = $('resume-drop-zone');
const browseResumeBtn = $('browse-resume');
const userName = $('user-name');
const userEmail = $('user-email');
const userPhone = $('user-phone');
const userAddress = $('user-address');
const userLinkedin = $('user-linkedin');
const companyName = $('company-name');
const jobTitle = $('job-title');
const jobDescriptionUrl = $('job-description-url');
const jobDescription = $('job-description');
const graduationDate = $('graduation-date');
const concentrations = $('concentrations');
const emphasis = $('emphasis');
const courses = $('courses');
const companyInteractions = $('company-interactions');
const additionalDetails = $('additional-details');
const generateBtn = $('generate-btn');
const outputSection = $('output-section');
const outputPreview = $('output-preview');
const downloadDocxBtn = $('download-docx');
const copyTextBtn = $('copy-text');
const regenerateBtn = $('regenerate-btn');

// --- Local Storage ---
const STORAGE_KEY = 'cover_letter_gen';

function saveToStorage() {
    const data = {
        apiProvider: apiProvider.value,
        apiKey: apiKey.value,
        userName: userName.value,
        userEmail: userEmail.value,
        userPhone: userPhone.value,
        userAddress: userAddress.value,
        userLinkedin: userLinkedin.value,
        graduationDate: graduationDate.value,
        concentrations: concentrations.value,
        emphasis: emphasis.value,
        courses: courses.value
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadFromStorage() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
        const data = JSON.parse(saved);
        if (data.apiProvider) apiProvider.value = data.apiProvider;
        if (data.apiKey) apiKey.value = data.apiKey;
        if (data.userName) userName.value = data.userName;
        if (data.userEmail) userEmail.value = data.userEmail;
        if (data.userPhone) userPhone.value = data.userPhone;
        if (data.userAddress) userAddress.value = data.userAddress;
        if (data.userLinkedin) userLinkedin.value = data.userLinkedin;
        if (data.graduationDate) graduationDate.value = data.graduationDate;
        if (data.concentrations) concentrations.value = data.concentrations;
        if (data.emphasis) emphasis.value = data.emphasis;
        if (data.courses) courses.value = data.courses;
    } catch (e) {
        // Ignore parse errors
    }
}

// Auto-save personal fields on change
[apiProvider, apiKey, userName, userEmail, userPhone, userAddress, userLinkedin,
 graduationDate, concentrations, emphasis, courses].forEach(el => {
    el.addEventListener('input', saveToStorage);
    el.addEventListener('change', saveToStorage);
});

// --- Mode Toggle ---
function setMode(mode) {
    currentMode = mode;
    modeFreeBtn.classList.toggle('active', mode === 'free');
    modeOwnKeyBtn.classList.toggle('active', mode === 'own-key');
    freeModeInfo.hidden = mode !== 'free';
    ownKeyFields.hidden = mode !== 'own-key';
}

modeFreeBtn.addEventListener('click', () => setMode('free'));
modeOwnKeyBtn.addEventListener('click', () => setMode('own-key'));

// --- File Upload ---
browseResumeBtn.addEventListener('click', () => resumeUpload.click());
resumeDropZone.addEventListener('click', (e) => {
    if (e.target === browseResumeBtn || e.target.closest('.btn-remove')) return;
    resumeUpload.click();
});

resumeDropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    resumeDropZone.classList.add('dragover');
});

resumeDropZone.addEventListener('dragleave', () => {
    resumeDropZone.classList.remove('dragover');
});

resumeDropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    resumeDropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length) {
        handleFileSelect(e.dataTransfer.files[0]);
    }
});

resumeUpload.addEventListener('change', () => {
    if (resumeUpload.files.length) {
        handleFileSelect(resumeUpload.files[0]);
    }
});

function handleFileSelect(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'doc', 'docx'].includes(ext)) {
        showToast('Please upload a .pdf, .doc, or .docx file.', 'error');
        return;
    }
    resumeFile = file;
    const content = resumeDropZone.querySelector('.file-upload-content');
    const selected = resumeDropZone.querySelector('.file-upload-selected');
    const fileName = selected.querySelector('.file-name');

    content.hidden = true;
    selected.hidden = false;
    fileName.textContent = file.name;
}

// Remove file button
resumeDropZone.querySelector('.btn-remove').addEventListener('click', (e) => {
    e.stopPropagation();
    resumeFile = null;
    resumeText = '';
    resumeUpload.value = '';
    const content = resumeDropZone.querySelector('.file-upload-content');
    const selected = resumeDropZone.querySelector('.file-upload-selected');
    content.hidden = false;
    selected.hidden = true;
});

// --- API Key Toggle ---
toggleKeyBtn.addEventListener('click', () => {
    const isPassword = apiKey.type === 'password';
    apiKey.type = isPassword ? 'text' : 'password';
});

// --- Generate ---
generateBtn.addEventListener('click', () => runGeneration());
regenerateBtn.addEventListener('click', () => runGeneration());

async function runGeneration() {
    // Validate required fields
    const errors = [];
    if (currentMode === 'own-key' && !apiKey.value.trim()) errors.push('API Key');
    if (!resumeFile) errors.push('Resume');
    if (!userName.value.trim()) errors.push('Full Name');
    if (!userEmail.value.trim()) errors.push('Email');
    if (!userPhone.value.trim()) errors.push('Phone');
    if (!userAddress.value.trim()) errors.push('Address');
    if (!userLinkedin.value.trim()) errors.push('LinkedIn URL');
    if (!companyName.value.trim()) errors.push('Company Name');
    if (!jobTitle.value.trim()) errors.push('Job Title');
    if (!jobDescription.value.trim()) errors.push('Job Description');

    if (errors.length) {
        showToast(`Please fill in: ${errors.join(', ')}`, 'error');
        return;
    }

    // Show loading
    const btnText = generateBtn.querySelector('.btn-text');
    const btnLoading = generateBtn.querySelector('.btn-loading');
    btnText.hidden = true;
    btnLoading.hidden = false;
    generateBtn.disabled = true;

    try {
        // Parse resume if not already done or if file changed
        if (!resumeText || resumeFile) {
            resumeText = await parseResume(resumeFile);
        }

        // Build data object
        const data = {
            resumeText,
            userName: userName.value.trim(),
            email: userEmail.value.trim(),
            phone: userPhone.value.trim(),
            address: userAddress.value.trim(),
            linkedin: userLinkedin.value.trim(),
            companyName: companyName.value.trim(),
            jobTitle: jobTitle.value.trim(),
            jobDescription: jobDescription.value.trim(),
            jobDescriptionUrl: jobDescriptionUrl.value.trim(),
            graduationDate: graduationDate.value.trim(),
            concentrations: concentrations.value.trim(),
            emphasis: emphasis.value.trim(),
            courses: courses.value.trim(),
            companyInteractions: companyInteractions.value.trim(),
            additionalDetails: additionalDetails.value.trim()
        };

        // Generate via AI
        generatedBody = await generateCoverLetter(data, currentMode, apiProvider.value, apiKey.value.trim());

        // Show output
        outputSection.hidden = false;
        outputPreview.textContent = generatedBody;
        outputSection.scrollIntoView({ behavior: 'smooth' });

        showToast('Cover letter generated successfully!', 'success');
    } catch (err) {
        console.error(err);
        showToast(err.message || 'Failed to generate cover letter.', 'error');
    } finally {
        btnText.hidden = false;
        btnLoading.hidden = true;
        generateBtn.disabled = false;
    }
}

// --- Download DOCX ---
downloadDocxBtn.addEventListener('click', async () => {
    if (!generatedBody) return;

    try {
        const data = {
            userName: userName.value.trim(),
            email: userEmail.value.trim(),
            phone: userPhone.value.trim(),
            address: userAddress.value.trim(),
            linkedin: userLinkedin.value.trim(),
            companyName: companyName.value.trim(),
            jobTitle: jobTitle.value.trim(),
            coverLetterBody: generatedBody
        };

        const blob = await generateDOCX(data);
        const filename = `${data.userName.replace(/\s+/g, '_')}_Cover_Letter_${data.companyName.replace(/\s+/g, '_')}.docx`;
        const fileSaver = await import('https://cdn.jsdelivr.net/npm/file-saver@2.0.5/+esm');
        (fileSaver.saveAs || fileSaver.default)(blob, filename);
    } catch (err) {
        console.error(err);
        showToast('Failed to generate DOCX file.', 'error');
    }
});

// --- Copy Text ---
copyTextBtn.addEventListener('click', async () => {
    if (!generatedBody) return;

    // Build full letter text for clipboard
    const today = new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
    const fullText = [
        userName.value.trim(),
        userAddress.value.trim(),
        userPhone.value.trim(),
        userEmail.value.trim(),
        userLinkedin.value.trim(),
        '',
        today,
        '',
        `${companyName.value.trim()} Recruiting Team`,
        companyName.value.trim(),
        `Re: ${jobTitle.value.trim()}`,
        '',
        `Dear ${companyName.value.trim()} Recruiting Team,`,
        '',
        generatedBody,
        '',
        'Sincerely,',
        '',
        userName.value.trim()
    ].join('\n');

    try {
        await navigator.clipboard.writeText(fullText);
        showToast('Copied to clipboard!', 'success');
    } catch {
        // Fallback
        const ta = document.createElement('textarea');
        ta.value = fullText;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast('Copied to clipboard!', 'success');
    }
});

// --- Toast ---
function showToast(message, type = 'error') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 4000);
}

// --- Init ---
loadFromStorage();
