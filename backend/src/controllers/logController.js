import CallLog from '../models/CallLog.js';

export async function getCallLogs(req, res, next) {
  try {
    const { status, type, agentName, page = 1, limit = 50 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (agentName) filter.agentName = { $regex: agentName, $options: 'i' };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
      CallLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      CallLog.countDocuments(filter),
    ]);

    res.json({
      logs,
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

export async function getCallLog(req, res, next) {
  try {
    const log = await CallLog.findById(req.params.id);
    if (!log) {
      return res.status(404).json({ error: 'Call log not found' });
    }
    res.json(log);
  } catch (error) {
    next(error);
  }
}

export async function getCallStats(req, res, next) {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const [total, completed, failed, inProgress] = await Promise.all([
      CallLog.countDocuments({ createdAt: { $gte: startDate } }),
      CallLog.countDocuments({ createdAt: { $gte: startDate }, status: 'completed' }),
      CallLog.countDocuments({ createdAt: { $gte: startDate }, status: 'failed' }),
      CallLog.countDocuments({ status: 'in-progress' }),
    ]);

    const avgDuration = await CallLog.aggregate([
      { $match: { createdAt: { $gte: startDate }, durationSeconds: { $gt: 0 } } },
      { $group: { _id: null, avg: { $avg: '$durationSeconds' } } },
    ]);

    res.json({
      total,
      completed,
      failed,
      inProgress,
      avgDurationSeconds: avgDuration[0]?.avg || 0,
    });
  } catch (error) {
    next(error);
  }
}
