import { useState, useEffect, useCallback } from 'react';
import { Phone, TrendingUp, Clock, CheckCircle, RefreshCw } from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { analytics, type Conversation } from '../services/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { LiveDuration } from '../components/LiveDuration';
import { useAnalyticsStream } from '../hooks/useAnalyticsStream';

export function Dashboard() {
  const [stats, setStats] = useState({
    totalCallsToday: 0, callChange: 0, successRate: 0,
    avgDuration: '0:00', activeAgents: 0, trainingAgents: 0,
  });
  const [callVolume, setCallVolume] = useState<{ date: string; calls: number }[]>([]);
  const [successRate, setSuccessRate] = useState<{ date: string; rate: number }[]>([]);
  const [recentConvs, setRecentConvs] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [live, setLive] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadCharts = useCallback(async () => {
    try {
      const [volData, rateData] = await Promise.all([
        analytics.callVolume(),
        analytics.successRate(),
      ]);
      setCallVolume(volData);
      setSuccessRate(rateData);
    } catch (_) {}
  }, []);

  useEffect(() => {
    analytics.dashboard().then(d => {
      setStats(d);
      setLoading(false);
    }).catch(() => setLoading(false));
    loadCharts();
  }, [loadCharts]);

  // Charts refresh every 30s (less volatile than stats)
  useEffect(() => {
    const t = setInterval(loadCharts, 30000);
    return () => clearInterval(t);
  }, [loadCharts]);

  useAnalyticsStream((payload) => {
    setStats(payload.stats);
    setRecentConvs(payload.recent as Conversation[]);
    setLastUpdated(new Date());
    setLive(true);
    if (loading) setLoading(false);
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const [d, volData, rateData, recentData] = await Promise.all([
        analytics.dashboard(),
        analytics.callVolume(),
        analytics.successRate(),
        analytics.recent(),
      ]);
      setStats(d);
      setCallVolume(volData);
      setSuccessRate(rateData);
      setRecentConvs(recentData as Conversation[]);
      setLastUpdated(new Date());
    } catch (_) {}
    setRefreshing(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><LoadingSpinner /></div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Overview of your voice agent performance</p>
        </div>
        <div className="flex items-center gap-3">
          {live && (
            <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              Live
            </span>
          )}
          {lastUpdated && (
            <span className="text-xs text-gray-400 hidden sm:block">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <StatCard
          title="Total Calls Today"
          value={String(stats.totalCallsToday)}
          change={`${stats.callChange >= 0 ? '+' : ''}${stats.callChange}% from yesterday`}
          changeType={stats.callChange >= 0 ? 'positive' : 'negative'}
          icon={Phone}
          iconColor="bg-blue-500"
        />
        <StatCard
          title="Success Rate"
          value={`${stats.successRate}%`}
          change="from recent calls"
          changeType="positive"
          icon={CheckCircle}
          iconColor="bg-green-500"
        />
        <StatCard
          title="Avg Call Duration"
          value={stats.avgDuration}
          change="average this period"
          changeType="neutral"
          icon={Clock}
          iconColor="bg-purple-500"
        />
        <StatCard
          title="Active Agents"
          value={String(stats.activeAgents)}
          change={`${stats.trainingAgents} in training`}
          changeType="neutral"
          icon={TrendingUp}
          iconColor="bg-orange-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Call Volume (Last 7 Days)</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={callVolume}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="calls" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Success Rate Trend</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={successRate}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} domain={[0, 100]} />
              <Tooltip />
              <Line type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Recent Conversations</h2>
          {live && <span className="text-xs text-green-600 font-medium">● Live</span>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
                <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Outcome</th>
                <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentConvs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-400">No conversations yet</td>
                </tr>
              ) : recentConvs.map((conv) => (
                <tr key={conv._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{conv.customerName}</td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600">{conv.agentName}</td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <LiveDuration status={conv.status ?? 'completed'} duration={conv.duration} createdAt={conv.createdAt} />
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      conv.outcome === 'success' ? 'bg-green-100 text-green-700'
                        : conv.outcome === 'transferred' ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {conv.outcome}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(conv.createdAt || conv.timestamp || '').toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
