import mongoose from 'mongoose';
import Conversation from '../models/Conversation.js';
import Agent from '../models/Agent.js';
import sseEmitter from '../utils/sseEmitter.js';

function buildDateRange(days) {
  const dates = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

async function fetchDashboardStats(userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalCallsToday, totalCallsYesterday, allConversationsToday, completedToday, activeAgents, trainingAgents] =
    await Promise.all([
      Conversation.countDocuments({ createdBy: userId, createdAt: { $gte: today } }),
      Conversation.countDocuments({
        createdBy: userId,
        createdAt: { $gte: new Date(today - 86400000), $lt: today },
      }),
      Conversation.find({ createdBy: userId, createdAt: { $gte: today } }).lean(),
      Conversation.find({ createdBy: userId, createdAt: { $gte: today }, status: 'completed', durationSeconds: { $gt: 0 } }).lean(),
      Agent.countDocuments({ createdBy: userId, status: 'active' }),
      Agent.countDocuments({ createdBy: userId, status: 'training' }),
    ]);

  const successToday = allConversationsToday.filter(c => c.outcome === 'success').length;
  const successRate = totalCallsToday > 0 ? Math.round((successToday / totalCallsToday) * 100) : 0;

  // Only average completed calls with real duration
  const totalDuration = completedToday.reduce((sum, c) => sum + (c.durationSeconds || 0), 0);
  const avgDurationSecs = completedToday.length > 0 ? Math.round(totalDuration / completedToday.length) : 0;
  const avgMins = Math.floor(avgDurationSecs / 60);
  const avgSecs = avgDurationSecs % 60;
  const callChange = totalCallsYesterday > 0
    ? Math.round(((totalCallsToday - totalCallsYesterday) / totalCallsYesterday) * 100)
    : 0;

  return {
    totalCallsToday,
    callChange,
    successRate,
    avgDuration: `${avgMins}:${String(avgSecs).padStart(2, '0')}`,
    activeAgents,
    trainingAgents,
  };
}

export async function getDashboardStats(req, res, next) {
  try {
    res.json(await fetchDashboardStats(req.user._id));
  } catch (error) {
    next(error);
  }
}

export async function streamAnalytics(req, res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const userId = req.user._id;

  const send = async (eventType = 'stats') => {
    try {
      const [stats, recent] = await Promise.all([
        fetchDashboardStats(userId),
        Conversation.find({ createdBy: userId }).sort({ createdAt: -1 }).limit(5).lean(),
      ]);
      res.write(`event: ${eventType}\ndata: ${JSON.stringify({ stats, recent })}\n\n`);
    } catch (_) {}
  };

  await send('init');

  const heartbeat = setInterval(() => send('heartbeat'), 10000);

  const onUpdate = (uid) => {
    if (uid.toString() === userId.toString()) send('update');
  };
  sseEmitter.on('stats_update', onUpdate);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseEmitter.off('stats_update', onUpdate);
    res.end();
  });
}

export async function getCallVolume(req, res, next) {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);
    const numDays = parseInt(req.query.days || '7');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (numDays - 1));
    startDate.setHours(0, 0, 0, 0);

    const rows = await Conversation.aggregate([
      { $match: { createdBy: userId, createdAt: { $gte: startDate } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, calls: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const map = Object.fromEntries(rows.map(r => [r._id, r.calls]));
    const data = buildDateRange(numDays).map(date => ({ date, calls: map[date] || 0 }));
    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function getSuccessRate(req, res, next) {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);
    const numDays = parseInt(req.query.days || '7');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (numDays - 1));
    startDate.setHours(0, 0, 0, 0);

    const rows = await Conversation.aggregate([
      { $match: { createdBy: userId, createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          total: { $sum: 1 },
          success: { $sum: { $cond: [{ $eq: ['$outcome', 'success'] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const map = Object.fromEntries(rows.map(r => [r._id, Math.round((r.success / r.total) * 100)]));
    const data = buildDateRange(numDays).map(date => ({ date, rate: map[date] ?? 0 }));
    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function getDurationTrend(req, res, next) {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);
    const numDays = parseInt(req.query.days || '7');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (numDays - 1));
    startDate.setHours(0, 0, 0, 0);

    const rows = await Conversation.aggregate([
      // Only completed calls with real duration for an accurate average
      { $match: { createdBy: userId, createdAt: { $gte: startDate }, status: 'completed', durationSeconds: { $gt: 0 } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          avgSeconds: { $avg: '$durationSeconds' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const map = Object.fromEntries(rows.map(r => [r._id, Math.round((r.avgSeconds / 60) * 10) / 10]));
    const data = buildDateRange(numDays).map(date => ({ date, minutes: map[date] ?? 0 }));
    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function getAgentPerformance(req, res, next) {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);
    const agents = await Agent.find({ createdBy: req.user._id }).lean();

    // Calculate real success rate from conversations per agent
    const stats = await Conversation.aggregate([
      { $match: { createdBy: userId } },
      {
        $group: {
          _id: '$agentName',
          total: { $sum: 1 },
          success: { $sum: { $cond: [{ $eq: ['$outcome', 'success'] }, 1, 0] } },
        },
      },
    ]);
    const statsMap = Object.fromEntries(stats.map(s => [s._id, s]));

    const performance = agents.map(agent => {
      const s = statsMap[agent.name];
      const total = s ? s.total : agent.callsHandled;
      const successRate = total > 0 ? Math.round((s ? s.success : 0) / total * 100) : 0;
      return {
        name: agent.name,
        calls: total,
        success: successRate,
      };
    });

    res.json(performance);
  } catch (error) {
    next(error);
  }
}

export async function getRecentConversations(req, res, next) {
  try {
    const recent = await Conversation.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    res.json(recent);
  } catch (error) {
    next(error);
  }
}
