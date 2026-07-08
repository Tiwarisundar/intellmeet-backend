const axios = require('axios');
const redis = require('../config/redis');

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Free models list — agar ek kaam na kare toh doosra try karo
const FREE_MODELS = [
  'openrouter/auto',
  'meta-llama/llama-3.3-70b-instruct:free',
  'openai/gpt-oss-20b:free',
  'openai/gpt-oss-120b:free',
  'nvidia/llama-3.1-nemotron-ultra-253b-v1:free',
  'google/gemma-3-27b-it:free'
];
// OpenRouter API call helper
const callOpenRouter = async (messages, modelIndex = 0) => {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not set in .env file');
  }

  const model = FREE_MODELS[modelIndex] || FREE_MODELS[0];
  console.log(`🤖 Calling OpenRouter with model: ${model}`);

  try {
    const response = await axios.post(
      OPENROUTER_URL,
      {
        model,
        messages,
        temperature: 0.3,
        max_tokens: 2000
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:5173',
          'X-Title': 'IntellMeet'
        },
        timeout: 30000
      }
    );

    const content = response.data?.choices?.[0]?.message?.content;
    if (!content) throw new Error('Empty response from AI');
    console.log('✅ OpenRouter response received');
    return content;

  } catch (error) {
    // Agar model unavailable hai toh next free model try karo
    const errMsg = error.response?.data?.error?.message || error.message || '';
    if (
      (errMsg.includes('unavailable') || errMsg.includes('free') || error.response?.status === 400)
      && modelIndex < FREE_MODELS.length - 1
    ) {
      console.log(`⚠️ Model ${model} unavailable, trying next...`);
      return callOpenRouter(messages, modelIndex + 1);
    }
    throw error;
  }
};

// JSON safe parse helper
const safeParseJSON = (text) => {
  let cleaned = text
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
};

// @route POST /api/ai/summary
const generateSummary = async (req, res) => {
  try {
    const { meetingId, transcript } = req.body;

    if (!transcript || transcript.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid transcript (minimum 10 characters)'
      });
    }

    const content = await callOpenRouter([
      {
        role: 'system',
        content: `You are an expert meeting analyst. Analyze the meeting transcript and return ONLY a valid JSON object.
Do NOT include any markdown, code blocks, or extra text — just pure JSON.

Return exactly this structure:
{
  "summary": "2-3 paragraph comprehensive meeting summary",
  "keyPoints": ["key point 1", "key point 2", "key point 3"],
  "actionItems": [
    {
      "task": "specific task",
      "owner": "person name",
      "deadline": "deadline or TBD",
      "priority": "high"
    }
  ],
  "decisions": ["decision 1", "decision 2"]
}`
      },
      {
        role: 'user',
        content: `Analyze this meeting transcript and return JSON only:\n\n${transcript}`
      }
    ]);

    let parsed = safeParseJSON(content);

    if (!parsed) {
      parsed = {
        summary: content,
        keyPoints: [],
        actionItems: [],
        decisions: []
      };
    }

    const result = {
      summary: parsed.summary || 'Summary not available',
      keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
      actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
      decisions: Array.isArray(parsed.decisions) ? parsed.decisions : []
    };

    // Redis cache
    if (meetingId && meetingId.trim()) {
      try {
        await redis.setex(
          `meeting:${meetingId}:summary`,
          86400,
          JSON.stringify(result)
        );
      } catch (e) {
        console.log('Redis cache skipped:', e.message);
      }
    }

    res.status(200).json({ success: true, ...result });

  } catch (error) {
    console.log('❌ AI Summary Error:', error.response?.data || error.message);
    const errMsg = error.response?.data?.error?.message
      || error.response?.data?.message
      || error.message
      || 'AI service error';
    res.status(500).json({ success: false, message: errMsg });
  }
};

// @route POST /api/ai/action-items
const extractActionItems = async (req, res) => {
  try {
    const { transcript, participants } = req.body;

    if (!transcript) {
      return res.status(400).json({
        success: false,
        message: 'Transcript is required'
      });
    }

    const content = await callOpenRouter([
      {
        role: 'system',
        content: `Extract all action items from the meeting transcript.
Return ONLY valid JSON with no extra text:
{
  "actionItems": [
    {
      "task": "specific task description",
      "owner": "person name",
      "priority": "high or medium or low",
      "deadline": "deadline or TBD",
      "status": "pending"
    }
  ]
}`
      },
      {
        role: 'user',
        content: `Participants: ${participants?.join(', ') || 'Unknown'}\n\nTranscript:\n${transcript}`
      }
    ]);

    const parsed = safeParseJSON(content);

    res.status(200).json({
      success: true,
      actionItems: parsed?.actionItems || []
    });

  } catch (error) {
    console.log('❌ Action Items Error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: error.response?.data?.error?.message || error.message
    });
  }
};

// @route GET /api/ai/summary/:meetingId
const getMeetingSummary = async (req, res) => {
  try {
    const { meetingId } = req.params;

    const cached = await redis.get(`meeting:${meetingId}:summary`);
    if (cached) {
      return res.status(200).json({
        success: true,
        source: 'cache',
        ...JSON.parse(cached)
      });
    }

    res.status(404).json({
      success: false,
      message: 'No summary found. Generate one first.'
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route POST /api/ai/chat
const aiMeetingChat = async (req, res) => {
  try {
    const { question, context } = req.body;

    if (!question) {
      return res.status(400).json({
        success: false,
        message: 'Question is required'
      });
    }

    const answer = await callOpenRouter([
      {
        role: 'system',
        content: `You are IntellMeet AI Assistant. Help users with meeting-related questions.
Be concise, helpful and professional.
Meeting Context: ${context || 'General meeting assistance'}`
      },
      {
        role: 'user',
        content: question
      }
    ]);

    res.status(200).json({ success: true, answer });

  } catch (error) {
    console.log('❌ AI Chat Error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: error.response?.data?.error?.message || error.message
    });
  }
};

// @route POST /api/ai/transcribe
const transcribeAudio = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Audio file required'
      });
    }
    res.status(200).json({
      success: true,
      text: 'Transcription feature coming soon'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  generateSummary,
  extractActionItems,
  getMeetingSummary,
  aiMeetingChat,
  transcribeAudio
};