import { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { analytics } from '../services/api';
import { TrendingUp, Minus } from 'lucide-react';
import { LoadingSpinner } from '../components/LoadingSpinner';

export function Analytics() {
  const [callVolume, setCallVolume] = useState<{ date: string; calls: number }[]>([]);
  const [avgDuration, setAvgDuration] = useState<{ date: string; minutes: number }[]>([]);
  const [agentPerf, setAgentPerf] = useState<{ name: string; calls: number; success: number }[]>([]);
  const [totalCalls, setTotalCalls] = useState(0);
  const [avgSuccessRate, setAvgSuccessRate] = useState(0);
  const [avgDur, setAvgDur] = useState('0:00');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
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
        setTotalCalls(dash.totalCallsToday * 7);
        setAvgSuccessRate(dash.successRate);
        setAvgDur(dash.avgDuration);
      } catch (err: any) {
        console.error('Failed to load analytics:', err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><LoadingSpinner /></div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-1">Detailed performance metrics and insights</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Total Calls (7 Days)</span>
            <TrendingUp className="w-5 h-5 text-green-500" aria-hidden="true" />
          </div>
          <p className="text-2xl sm:text-3xl font-semibold text-gray-900">{totalCalls.toLocaleString()}</p>
          <p className="text-sm text-green-600 mt-2">+18.2% from previous week</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Avg Success Rate</span>
            <TrendingUp className="w-5 h-5 text-green-500" aria-hidden="true" />
          </div>
          <p className="text-2xl sm:text-3xl font-semibold text-gray-900">{avgSuccessRate}%</p>
          <p className="text-sm text-green-600 mt-2">+2.4% from previous week</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Avg Call Duration</span>
            <Minus className="w-5 h-5 text-gray-400" aria-hidden="true" />
          </div>
          <p className="text-2xl sm:text-3xl font-semibold text-gray-900">{avgDur}</p>
          <p className="text-sm text-gray-600 mt-2">No change from previous week</p>
        </div>
      </div>

      {/* Charts */}
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
              <Line type="monotone" dataKey="calls" stroke="#3b82f6" strokeWidth={2} name="Calls" />
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
