// AI Service - handles cover letter generation via OpenAI or Anthropic APIs

const COVER_LETTER_EXAMPLES = {
    marketing: `I had the pleasure of attending Mattel's 4Ps event at Target last November where I spoke with Mark Morse and learned about the exciting marketing opportunities at Mattel, especially with the global brand team. I believe I understand the challenges that Mattel is facing, from the growth of digital games to leveraging the Mattel brand across different countries. After recently speaking with Geoff Walker and discussing those challenges, I strongly believe that I will be a perfect fit at Mattel and that my professional and academic experience will enable me to add significant value to Mattel and its customers:
- Delivering results: As a professional runner who trained more than 20 hours a week while succeeding in a full-time job, I had to be result-oriented to reach my goals. At Empire Marketing, a direct marketing company, I performed door-to-door sales before quickly advancing to a leadership position due to my tenacity to exceed sales expectations ($11,000 a week on average) and my passion for analyzing data to improve sales and find new opportunities.
- Showing marketing acumen: During my time at the CA Balma, an athletic club, I was in charge of organizing a national 10K race. I conducted research through surveys and focus groups that led me to change the positioning of the race. Instead of marketing the event as a very competitive race, we expanded our target market and positioned the event as a family-friendly race for everyone. As a result, revenue went up by 22%.
- Creativity: I identified a missed source for potential leads and implemented an incentive system in which $20 would be given to existing customers for referrals. As a result, both sales and customer satisfaction increased.
Throughout my professional and academic career, I have strived to exceed goals and solve problems. I would love to have an opportunity to demonstrate these abilities at Mattel this summer.`,

    finance: `I am applying to the Sr. Manager position of the E3 Strategy and Finance Program with Walmart. My work in retail finance and strategy with Gap and Target would enable me to quickly add value for Walmart and adapt to new roles. In addition, I have firsthand experience launching new businesses in Asia while living in Hong Kong, integrating online sales with brick and mortar retail operations, and implementing omnichannel strategies. These are all challenges that Walmart has faced in recent years.
My career began with SunTrust Banks, where I strengthened my communications and networking skills through client-facing interactions. Seeking a more analytical role, I transitioned into supply chain finance with Gap Inc. During the first three years, I was rewarded with three promotions and took on increasing levels of responsibility. I used my knowledge of VBA to solve challenging problems that had led to inefficiencies within supply chain finance. I developed Excel add-ins and automated models that reduced monthly responsibilities annually by more than 1000 hours across North America.
Most recently, I served as an internal consultant for Target's online finance and supply chain teams, where I proposed an integrated inventory management and supply chain strategy projected to increase operating margins by 41% and EBIT by 85% by 2020.
I am confident that my communications skills and ability to rapidly adapt, paired with an extensive experience with finance and operations in the retail sector, will make me an immediate asset for Walmart.`,

    consulting: `It is with great excitement that I put forth my application for the MBA internship at COMPANY NAME. In talking with company representatives, I am struck by the inclusive and welcoming culture. Each representative I spoke with was incredibly intentional in creating a personal relationship and made me feel as though we had known each other for some time.
I decided to pursue my MBA because I wanted to transition to a career path where I could work on teams to solve complex, pressing problems. My time leading teacher teams as an educator has allowed me to cultivate the following skills:
- Clear communication: As a teacher, I learned that clear, concise communication allowed my students to grasp high-level concepts quickly. I also created and articulated team goals and priorities clearly to ensure our team could effectively support our students and families consistently each day.
- Adaptability: In moments of ambiguity, I have learned to adjust course in real-time and provide quick, mission-aligned solutions. Learning to be flexible in public situations taught me the value of remaining positive and poised.
- Relationship Building: I built authentic relationships with students, families, staff, and community members, many of whom had vastly different life experiences from my own.
My desire to help organizations create meaningful and lasting priorities coupled with my experiences as an educator-turned-MBA candidate would allow me to immediately add value.`
};

function buildPrompt(data) {
    const today = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    let prompt = `You are an expert cover letter writer. Today's date is ${today}.

Write a cover letter for the following role: ${data.jobTitle} at ${data.companyName}.

ABOUT THE CANDIDATE:
Resume:
${data.resumeText}

Name: ${data.userName}
LinkedIn: ${data.linkedin}`;

    if (data.graduationDate) {
        prompt += `\nGraduation Date: ${data.graduationDate} (this is when they could begin working full-time)`;
    }

    if (data.concentrations) {
        prompt += `\nConcentrations/Focus Areas: ${data.concentrations}`;
    }

    if (data.emphasis) {
        prompt += `\nEmphasis: ${data.emphasis}`;
    }

    if (data.courses) {
        prompt += `\nRelevant Courses: ${data.courses}`;
    }

    prompt += `

JOB DESCRIPTION:
${data.jobDescription}`;

    if (data.jobDescriptionUrl) {
        prompt += `\nJob Posting URL: ${data.jobDescriptionUrl}`;
    }

    if (data.companyInteractions) {
        prompt += `\n\nINTERACTIONS WITH COMPANY REPRESENTATIVES:
${data.companyInteractions}`;
    }

    if (data.additionalDetails) {
        prompt += `\n\nADDITIONAL CONTEXT:
${data.additionalDetails}`;
    }

    prompt += `

COVER LETTER EXAMPLES (for tone and structure reference only, do not copy content):

Example 1 (Marketing):
${COVER_LETTER_EXAMPLES.marketing}

Example 2 (Finance/Strategy):
${COVER_LETTER_EXAMPLES.finance}

Example 3 (Consulting):
${COVER_LETTER_EXAMPLES.consulting}

INSTRUCTIONS:
1. Research what you know about ${data.companyName}'s mission, vision, values, culture, and recent initiatives. Weave relevant details into the letter.
2. Write a concise, engaging, and professional cover letter following these 5 rules:
   a. Open with a strong self-introduction and an engaging hook (reference company interactions if provided)
   b. Highlight relevant experience and achievements from the resume
   c. Connect the candidate's background to the company's mission and values
   d. End with a confident and strong closing statement
   e. Ensure the formatting is clean, professional, and ATS-friendly
3. Keep it under 400 words and within one page.
4. The tone should be professional yet engaging.
5. CRITICAL STYLE RULES - this must NOT read like AI wrote it:
   - No em dashes (use commas or periods instead)
   - Minimize similes
   - Avoid the "not just X, it's Y" format
   - Avoid generic filler phrases like "I am excited to apply" or "I am confident that"
   - Use specific, concrete details from the resume
   - Vary sentence structure and length
6. If appropriate, mention relevant coursework, concentrations, or emphasis areas.
7. Address the letter to "${data.companyName} Recruiting Team" unless specific names were provided in the company interactions.

OUTPUT FORMAT:
Return ONLY the body of the cover letter (the paragraphs between "Dear [Recipient]," and "Sincerely,"). Do not include the header, date, greeting, closing, or signature. Just the body paragraphs.`;

    return prompt;
}

// Vercel backend URL - update this after deploying to Vercel
const BACKEND_URL = localStorage.getItem('cl_backend_url') || '';

export async function generateCoverLetter(data, mode, provider, apiKey) {
    const prompt = buildPrompt(data);

    if (mode === 'free') {
        return callFreeBackend(prompt);
    } else if (provider === 'openai') {
        return callOpenAI(prompt, apiKey);
    } else if (provider === 'anthropic') {
        return callAnthropic(prompt, apiKey);
    }
}

async function callFreeBackend(prompt) {
    const backendUrl = BACKEND_URL;
    if (!backendUrl) {
        throw new Error('Free mode is not yet configured. Please use your own API key, or check back later.');
    }

    const response = await fetch(`${backendUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ prompt })
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Server error: ${response.status}`);
    }

    const result = await response.json();
    return result.text;
}

async function callOpenAI(prompt, apiKey) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert cover letter writer. You write concise, professional, and engaging cover letters that sound authentically human. You never use em dashes.'
                },
                { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 1500
        })
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `OpenAI API error: ${response.status}`);
    }

    const result = await response.json();
    return result.choices[0].message.content.trim();
}

async function callAnthropic(prompt, apiKey) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1500,
            messages: [
                { role: 'user', content: prompt }
            ]
        })
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `Anthropic API error: ${response.status}`);
    }

    const result = await response.json();
    return result.content[0].text.trim();
}
