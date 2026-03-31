import crypto from 'crypto';

const RATE_LIMIT_SECRET = process.env.RATE_LIMIT_SECRET || 'cover-letter-gen-default-secret';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const COOKIE_NAME = 'cl_gen_token';

function getTodayString() {
    return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function createToken(ip, date) {
    const hmac = crypto.createHmac('sha256', RATE_LIMIT_SECRET);
    hmac.update(`${ip}:${date}`);
    return hmac.digest('hex');
}

function parseCookies(cookieHeader) {
    const cookies = {};
    if (!cookieHeader) return cookies;
    cookieHeader.split(';').forEach(c => {
        const [key, ...val] = c.trim().split('=');
        cookies[key] = val.join('=');
    });
    return cookies;
}

export default async function handler(req, res) {
    // CORS headers for GitHub Pages
    const origin = req.headers.origin || '';
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!OPENAI_API_KEY) {
        return res.status(500).json({ error: 'Server API key not configured' });
    }

    // Rate limit check
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
        || req.headers['x-real-ip']
        || 'unknown';
    const today = getTodayString();
    const expectedToken = createToken(ip, today);
    const cookies = parseCookies(req.headers.cookie);

    if (cookies[COOKIE_NAME] === expectedToken) {
        return res.status(429).json({
            error: 'You have reached your free daily limit (1 per day). Enter your own API key to generate more.'
        });
    }

    // Parse request body
    const { prompt } = req.body;
    if (!prompt) {
        return res.status(400).json({ error: 'Missing prompt' });
    }

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
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
            return res.status(response.status).json({
                error: err.error?.message || `AI API error: ${response.status}`
            });
        }

        const result = await response.json();
        const text = result.choices[0].message.content.trim();

        // Set rate limit cookie (expires at midnight UTC)
        const tomorrow = new Date();
        tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
        tomorrow.setUTCHours(0, 0, 0, 0);

        res.setHeader('Set-Cookie',
            `${COOKIE_NAME}=${expectedToken}; Path=/; Expires=${tomorrow.toUTCString()}; HttpOnly; SameSite=None; Secure`
        );

        return res.status(200).json({ text });
    } catch (err) {
        return res.status(500).json({ error: err.message || 'Internal server error' });
    }
}
