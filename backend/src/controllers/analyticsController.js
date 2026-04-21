import mongoose from 'mongoose';
import Conversation from '../models/Conversation.js';
import Agent from '../models/Agent.js';

export async function getDashboardStats(req, res, next) {
  try {
    const userId = req.user._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalCallsToday,
      totalCallsYesterday,
      allConversationsToday,
      activeAgents,
      trainingAgents,
    ] = await Promise.all([
      Conversation.countDocuments({ createdBy: userId, createdAt: { $gte: today } }),
      Conversation.countDocuments({
        createdBy: userId,
        createdAt: { $gte: new Date(today - 86400000), $lt: today },
      }),
      Conversation.find({ createdBy: userId, createdAt: { $gte: today } }).lean(),
      Agent.countDocuments({ createdBy: userId, status: 'active' }),
      Agent.countDocuments({ createdBy: userId, status: 'training' }),
    ]);

    const successToday = allConversationsToday.filter(c => c.outcome === 'success').length;
    const successRate = totalCallsToday > 0 ? Math.round((successToday / totalCallsToday) * 100) : 0;

    const totalDuration = allConversationsToday.reduce((sum, c) => sum + (c.durationSeconds || 0), 0);
    const avgDurationSecs = totalCallsToday > 0 ? Math.round(totalDuration / totalCallsToday) : 0;
    const avgMins = Math.floor(avgDurationSecs / 60);
    const avgSecs = avgDurationSecs % 60;

    const callChange = totalCallsYesterday > 0
      ? Math.round(((totalCallsToday - totalCallsYesterday) / totalCallsYesterday) * 100)
      : 0;

    res.json({
      totalCallsToday,
      callChange,
      successRate,
      avgDuration: `${avgMins}:${avgSecs.toString().padStart(2, '0')}`,
      activeAgents,
      trainingAgents,
    });
  } catch (error) {
    next(error);
  }
}

export async function getCallVolume(req, res, next) {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    startDate.setHours(0, 0, 0, 0);

    const data = await Conversation.aggregate([
      { $match: { createdBy: userId, createdAt: { $gte: startDate } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, calls: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', calls: 1, _id: 0 } },
    ]);

    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function getSuccessRate(req, res, next) {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    startDate.setHours(0, 0, 0, 0);

    const data = await Conversation.aggregate([
      { $match: { createdBy: userId, createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          total: { $sum: 1 },
          success: { $sum: { $cond: [{ $eq: ['$outcome', 'success'] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', _id: 0, rate: { $round: [{ $multiply: [{ $divide: ['$success', '$total'] }, 100] }, 1] } } },
    ]);

    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function getDurationTrend(req, res, next) {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    startDate.setHours(0, 0, 0, 0);

    const data = await Conversation.aggregate([
      { $match: { createdBy: userId, createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          avgSeconds: { $avg: '$durationSeconds' },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', _id: 0, minutes: { $round: [{ $divide: ['$avgSeconds', 60] }, 1] } } },
    ]);

    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function getAgentPerformance(req, res, next) {
  try {
    const agents = await Agent.find({ createdBy: req.user._id }).lean();

    const performance = agents.map(agent => ({
      name: agent.name,
      calls: agent.callsHandled,
      success: agent.successRate,
    }));

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
