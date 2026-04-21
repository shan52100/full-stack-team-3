import Conversation from '../models/Conversation.js';

export async function getConversations(req, res, next) {
  try {
    const { search, outcome, page = 1, limit = 20 } = req.query;

    // Scope to the logged-in user's conversations only
    const filter = { createdBy: req.user._id };

    if (outcome && outcome !== 'all') {
      filter.outcome = outcome;
    }

    if (search) {
      filter.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { agentName: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [conversations, total] = await Promise.all([
      Conversation.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Conversation.countDocuments(filter),
    ]);

    res.json({
      conversations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getConversation(req, res, next) {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    res.json(conversation);
  } catch (error) {
    next(error);
  }
}

export async function getTranscript(req, res, next) {
  try {
    const conversation = await Conversation.findById(req.params.id).select('transcript agentName customerName');
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    res.json({
      agentName: conversation.agentName,
      customerName: conversation.customerName,
      transcript: conversation.transcript,
    });
  } catch (error) {
    next(error);
  }
}

export async function exportConversations(req, res, next) {
  try {
    const { outcome, search } = req.query;
    const filter = {};

    if (outcome && outcome !== 'all') {
      filter.outcome = outcome;
    }

    if (search) {
      filter.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { agentName: { $regex: search, $options: 'i' } },
      ];
    }

    // Add user scope to export too
    filter.createdBy = req.user._id;

    const conversations = await Conversation.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    // CSV export — includes full transcript as pipe-separated turns
    const header = 'ID,Customer,Agent,Phone,Duration,Outcome,Sentiment,Timestamp,Summary,Transcript\n';
    const esc = (v) => `"${String(v || '').replace(/"/g, '""')}"`;
    const rows = conversations.map(c => {
      const transcriptText = (c.transcript || [])
        .map(t => `[${t.role}] ${t.text}`)
        .join(' | ');
      return [
        esc(c._id),
        esc(c.customerName),
        esc(c.agentName),
        esc(c.customerPhone),
        esc(c.duration),
        esc(c.outcome),
        esc(c.sentiment),
        esc(c.createdAt),
        esc(c.summary),
        esc(transcriptText),
      ].join(',');
    }).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=conversations.csv');
    res.send(header + rows);
  } catch (error) {
    next(error);
  }
}

export async function createConversation(req, res, next) {
  try {
    const conversation = await Conversation.create(req.body);
    res.status(201).json(conversation);
  } catch (error) {
    next(error);
  }
}

/**
 * Called by agent.py when a session closes — updates the conversation
 * with transcript, duration, outcome, and summary.
 */
export async function completeConversation(req, res, next) {
  try {
    const { roomName } = req.params;
    const { transcript, durationSeconds, outcome, summary, sentiment } = req.body;

    const conversation = await Conversation.findOne({ roomName });
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found for this room' });
    }

    if (transcript && transcript.length > 0) {
      conversation.transcript = transcript;
    }
    if (durationSeconds !== undefined) {
      conversation.durationSeconds = durationSeconds;
      const mins = Math.floor(durationSeconds / 60);
      const secs = Math.floor(durationSeconds % 60);
      conversation.duration = `${mins}:${String(secs).padStart(2, '0')}`;
    }
    if (outcome) conversation.outcome = outcome;
    if (summary) conversation.summary = summary;
    if (sentiment) conversation.sentiment = sentiment;

    await conversation.save();
    console.log(`[Conversation] Updated for room ${roomName}: ${conversation.duration}, ${conversation.transcript.length} messages`);

    res.json(conversation);
  } catch (error) {
    next(error);
  }
}
