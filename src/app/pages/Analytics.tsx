import { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { analytics } from '../services/api';
import { TrendingUp, Minus, RefreshCw } from 'lucide-react';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useAnalyticsStream } from '../hooks/useAnalyticsStream';

export function Analytics() {
  const [callVolume, setCallVolume] = useState<{ date: string; calls: number }[]>([]);
  const [avgDuration, setAvgDuration] = useState<{ date: string; minutes: number }[]>([]);
  const [agentPerf, setAgentPerf] = useState<{ name: string; calls: number; success: number }[]>([]);
  const [totalCalls, setTotalCalls] = useState(0);
  const [avgSuccessRate, setAvgSuccessRate] = useState(0);
  const [avgDur, setAvgDur] = useState('0:00');
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [live, setLive] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadCharts = useCallback(async () => {
    try {
      const [vol, dur, perf] = await Promise.all([
        analytics.callVolume(),
        analytics.duration(),
        analytics.agentPerformance(),
      ]);
      setCallVolume(vol);
      setAvgDuration(dur);
      setAgentPerf(perf);
    } catch (_) {}
  }, []);

  useEffect(() => {
    async function init() {
      try {
        const [vol, dur, perf, dash] = await Promise.all([
          analytics.callVolume(),
          analytics.duration(),
          analytics.agentPerformance(),
          analytics.dashboard(),
        ]);
        setCallVolume(vol);
        setAvgDuration(dur);
        setAgentPerf(perf);
        setTotalCalls(dash.totalCallsToday);
        setAvgSuccessRate(dash.successRate);
        setAvgDur(dash.avgDuration);
        setLastUpdated(new Date());
      } catch (_) {}
      setLoading(false);
    }
    init();
  }, []);

  // Charts refresh every 30s
  useEffect(() => {
    const t = setInterval(loadCharts, 30000);
    return () => clearInterval(t);
  }, [loadCharts]);

  // SSE pushes stat updates instantly
  useAnalyticsStream((payload) => {
    setTotalCalls(payload.stats.totalCallsToday);
    setAvgSuccessRate(payload.stats.successRate);
    setAvgDur(payload.stats.avgDuration);
    setLastUpdated(new Date());
    setLive(true);
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const [vol, dur, perf, dash] = await Promise.all([
        analytics.callVolume(),
        analytics.duration(),
        analytics.agentPerformance(),
        analytics.dashboard(),
      ]);
      setCallVolume(vol);
      setAvgDuration(dur);
      setAgentPerf(perf);
      setTotalCalls(dash.totalCallsToday);
      setAvgSuccessRate(dash.successRate);
      setAvgDur(dash.avgDuration);
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
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">Detailed performance metrics and insights</p>
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
            Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics — update via SSE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Total Calls Today</span>
            <TrendingUp className="w-5 h-5 text-green-500" aria-hidden="true" />
          </div>
          <p className="text-2xl sm:text-3xl font-semibold text-gray-900">{totalCalls.toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-2">live count</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Avg Success Rate</span>
            <TrendingUp className="w-5 h-5 text-green-500" aria-hidden="true" />
          </div>
          <p className="text-2xl sm:text-3xl font-semibold text-gray-900">{avgSuccessRate}%</p>
          <p className="text-sm text-gray-500 mt-2">live rate</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Avg Call Duration</span>
            <Minus className="w-5 h-5 text-gray-400" aria-hidden="true" />
          </div>
          <p className="text-2xl sm:text-3xl font-semibold text-gray-900">{avgDur}</p>
          <p className="text-sm text-gray-500 mt-2">live average</p>
        </div>
      </div>

      {/* Charts — refresh every 30s */}
      <div className="space-y-4 sm:space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Call Volume Over Time</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={callVolume}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="calls" stroke="#3b82f6" strokeWidth={2} dot={false} name="Calls" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Average Call Duration (Minutes)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={avgDuration}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip />
              <Legend />
              <Bar dataKey="minutes" fill="#8b5cf6" name="Avg Duration (min)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Agent Performance Comparison</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={agentPerf}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
              <YAxis yAxisId="left" stroke="#6b7280" fontSize={12} />
              <YAxis yAxisId="right" orientation="right" stroke="#6b7280" fontSize={12} domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="calls" fill="#3b82f6" name="Total Calls" />
              <Bar yAxisId="right" dataKey="success" fill="#10b981" name="Success Rate %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
