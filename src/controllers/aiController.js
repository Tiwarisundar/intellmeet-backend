const { GoogleGenerativeAI } = require('@google/generative-ai');
const redis = require('../config/redis');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const getModel = () => genAI.getGenerativeModel({
  model: "gemini-2.0-flash"
});

// Helper — JSON safely parse karo
const safeParseJSON = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/```json\n?([\s\S]*?)\n?```/) ||
                  text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[1] || match[0]);
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
        message: 'Please provide a valid transcript'
      });
    }

    console.log('🤖 Generating summary with Gemini...');

    const model = getModel();

    const prompt = `You are an expert meeting analyst. Analyze the following meeting transcript and return a JSON response.

MEETING TRANSCRIPT:
${transcript}

Return ONLY a valid JSON object with this exact structure (no markdown, no extra text):
{
  "summary": "A comprehensive 2-3 paragraph summary of the meeting",
  "keyPoints": ["key point 1", "key point 2", "key point 3"],
  "actionItems": [
    {
      "task": "specific task description",
      "owner": "person responsible",
      "deadline": "deadline if mentioned or TBD",
      "priority": "high or medium or low"
    }
  ],
  "decisions": ["decision 1", "decision 2"]
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    console.log('✅ Gemini response received');

    let parsed = safeParseJSON(text);

    if (!parsed) {
      parsed = {
        summary: text,
        keyPoints: [],
        actionItems: [],
        decisions: []
      };
    }

    const response = {
      summary: parsed.summary || 'Summary not available',
      keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
      actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
      decisions: Array.isArray(parsed.decisions) ? parsed.decisions : []
    };

    if (meetingId) {
      await redis.setex(
        `meeting:${meetingId}:summary`,
        86400,
        JSON.stringify(response)
      );
    }

    res.status(200).json({ success: true, ...response });

  } catch (error) {
    console.log('❌ Gemini Error:', error.message);
    res.status(500).json({
      success: false,
      message: `AI Error: ${error.message}`
    });
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

    const model = getModel();

    const prompt = `Extract all action items from this meeting transcript.
Participants: ${participants?.join(', ') || 'Unknown'}

TRANSCRIPT:
${transcript}

Return ONLY valid JSON (no markdown):
{
  "actionItems": [
    {
      "task": "specific task",
      "owner": "person name",
      "priority": "high or medium or low",
      "deadline": "deadline or TBD",
      "status": "pending"
    }
  ]
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = safeParseJSON(text);

    res.status(200).json({
      success: true,
      actionItems: parsed?.actionItems || []
    });

  } catch (error) {
    console.log('❌ Action Items Error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
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

    const model = getModel();

    const prompt = `You are IntellMeet AI Assistant helping with meeting-related questions.

Meeting Context:
${context || 'General meeting assistance'}

User Question: ${question}

Provide a clear, concise and helpful answer.`;

    const result = await model.generateContent(prompt);

    res.status(200).json({
      success: true,
      answer: result.response.text()
    });

  } catch (error) {
    console.log('❌ AI Chat Error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
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