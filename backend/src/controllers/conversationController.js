import Conversation from '../models/Conversation.js';
import sseEmitter from '../utils/sseEmitter.js';

export async function getConversations(req, res, next) {
  try {
    const { search, outcome, status, page = 1, limit = 20 } = req.query;
    const filter = { createdBy: req.user._id };

    if (outcome && outcome !== 'all') filter.outcome = outcome;
    if (status && status !== 'all') filter.status = status;
    if (search) {
      filter.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { agentName: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [conversations, total] = await Promise.all([
      Conversation.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      Conversation.countDocuments(filter),
    ]);

    res.json({
      conversations,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    next(error);
  }
}

export async function getConversation(req, res, next) {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    res.json(conversation);
  } catch (error) {
    next(error);
  }
}

export async function getTranscript(req, res, next) {
  try {
    const conversation = await Conversation.findById(req.params.id)
      .select('transcript agentName customerName status');
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    res.json({
      agentName: conversation.agentName,
      customerName: conversation.customerName,
      status: conversation.status,
      transcript: conversation.transcript,
    });
  } catch (error) {
    next(error);
  }
}

export async function streamConversations(req, res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const userId = req.user._id;

  const send = async (eventType = 'update') => {
    try {
      const conversations = await Conversation.find({ createdBy: userId })
        .sort({ createdAt: -1 }).limit(50).lean();
      res.write(`event: ${eventType}\ndata: ${JSON.stringify({ conversations })}\n\n`);
    } catch (_) {}
  };

  await send('init');

  const heartbeat = setInterval(() => {
    res.write(`event: heartbeat\ndata: {}\n\n`);
  }, 10000);

  const onUpdate = (uid) => {
    if (uid.toString() === userId.toString()) send('update');
  };
  sseEmitter.on('conversations_update', onUpdate);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseEmitter.off('conversations_update', onUpdate);
    res.end();
  });
}

export async function addTranscriptEntry(req, res, next) {
  try {
    const { roomName } = req.params;
    const { role, text, timestamp } = req.body;

    if (!role || !text) return res.status(400).json({ error: 'role and text required' });

    const conversation = await Conversation.findOne({ roomName });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

    conversation.transcript.push({ role, text, timestamp: timestamp ? new Date(timestamp) : new Date() });
    await conversation.save();

    if (conversation.createdBy) {
      sseEmitter.emit('conversations_update', conversation.createdBy);
    }

    res.json({ ok: true, count: conversation.transcript.length });
  } catch (error) {
    next(error);
  }
}

export async function exportConversations(req, res, next) {
  try {
    const { outcome, search } = req.query;
    const filter = { createdBy: req.user._id };

    if (outcome && outcome !== 'all') filter.outcome = outcome;
    if (search) {
      filter.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { agentName: { $regex: search, $options: 'i' } },
      ];
    }

    const conversations = await Conversation.find(filter).sort({ createdAt: -1 }).lean();
    const header = 'ID,Customer,Agent,Phone,Duration,Outcome,Sentiment,Timestamp,Summary,Transcript\n';
    const esc = (v) => `"${String(v || '').replace(/"/g, '""')}"`;
    const rows = conversations.map(c => {
      const transcriptText = (c.transcript || []).map(t => `[${t.role}] ${t.text}`).join(' | ');
      return [esc(c._id), esc(c.customerName), esc(c.agentName), esc(c.customerPhone),
        esc(c.duration), esc(c.outcome), esc(c.sentiment), esc(c.createdAt),
        esc(c.summary), esc(transcriptText)].join(',');
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
    if (conversation.createdBy) {
      sseEmitter.emit('conversations_update', conversation.createdBy);
      sseEmitter.emit('stats_update', conversation.createdBy);
    }
    res.status(201).json(conversation);
  } catch (error) {
    next(error);
  }
}

export async function completeConversation(req, res, next) {
  try {
    const { roomName } = req.params;
    const { transcript, durationSeconds, outcome, summary, sentiment } = req.body;

    const conversation = await Conversation.findOne({ roomName });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found for this room' });

    if (transcript && transcript.length > 0) conversation.transcript = transcript;
    if (durationSeconds !== undefined) {
      conversation.durationSeconds = durationSeconds;
      const mins = Math.floor(durationSeconds / 60);
      const secs = Math.floor(durationSeconds % 60);
      conversation.duration = `${mins}:${String(secs).padStart(2, '0')}`;
    }
    if (outcome) conversation.outcome = outcome;
    if (summary) conversation.summary = summary;
    if (sentiment) conversation.sentiment = sentiment;
    conversation.status = 'completed';

    await conversation.save();
    console.log(`[Conversation] Completed room ${roomName}: ${conversation.duration}, ${conversation.transcript.length} turns`);

    if (conversation.createdBy) {
      sseEmitter.emit('conversations_update', conversation.createdBy);
      sseEmitter.emit('stats_update', conversation.createdBy);
    }

    res.json(conversation);
  } catch (error) {
    next(error);
  }
}
