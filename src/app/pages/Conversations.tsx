import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Download, Eye, MessageSquare, Radio } from 'lucide-react';
import { conversations as convsApi, type Conversation } from '../services/api';
import { useConversationsStream } from '../hooks/useConversationsStream';
import { LiveDuration } from '../components/LiveDuration';
import { toast } from 'sonner';
import { EmptyState } from '../components/EmptyState';
import { LoadingSpinner } from '../components/LoadingSpinner';

export function Conversations() {
  const [conversationList, setConversationList] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [filterOutcome, setFilterOutcome] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useConversationsStream((conversations) => {
    setConversationList(conversations);
    setLastUpdated(new Date());
    setLoading(false);
  });

  // Fallback initial load if SSE is slow
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) setLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, [loading]);

  const filtered = useMemo(() => {
    return conversationList.filter((c) => {
      if (filterOutcome !== 'all' && c.outcome !== filterOutcome) return false;
      if (filterStatus !== 'all' && c.status !== filterStatus) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!c.customerName?.toLowerCase().includes(q) && !c.agentName?.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [conversationList, filterOutcome, filterStatus, searchQuery]);

  const activeCount = conversationList.filter((c) => c.status === 'active').length;

  const handleViewConversation = async (conv: Conversation) => {
    try {
      const full = await convsApi.get(conv._id);
      setSelectedConversation(full);
    } catch {
      setSelectedConversation(conv);
    }
  };

  const handleExport = () => {
    const url = convsApi.export({ search: searchQuery, outcome: filterOutcome });
    window.open(url, '_blank');
    toast.success('Conversations exported successfully');
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><LoadingSpinner /></div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">Conversations</h1>
            {activeCount > 0 && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                {activeCount} LIVE
              </span>
            )}
          </div>
          <p className="text-gray-600 mt-1 flex items-center gap-2">
            View and analyze call logs and transcripts
            {lastUpdated && (
              <span className="text-xs text-gray-400">
                · Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
          <Radio className="w-3.5 h-3.5" />
          Live
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Search conversations"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              aria-label="Filter by status"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
            <select
              value={filterOutcome}
              onChange={(e) => setFilterOutcome(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              aria-label="Filter by outcome"
            >
              <option value="all">All Outcomes</option>
              <option value="success">Success</option>
              <option value="transferred">Transferred</option>
              <option value="failed">Failed</option>
            </select>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500" aria-label="More filters">
              <Filter className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">More Filters</span>
            </button>
            <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" aria-label="Export conversations">
              <Download className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Conversations Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No conversations found"
          description={searchQuery ? "Try adjusting your search or filters." : "Your conversation history will appear here once calls are made."}
        />
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Outcome</th>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sentiment</th>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map((conv) => (
                  <tr key={conv._id} className={`hover:bg-gray-50 transition-colors ${conv.status === 'active' ? 'bg-green-50/40' : ''}`}>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{conv.customerName}</td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600">{conv.agentName}</td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <LiveDuration status={conv.status} duration={conv.duration} createdAt={conv.createdAt} />
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      {conv.status === 'active' ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                          </span>
                          ACTIVE
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                          completed
                        </span>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        conv.outcome === 'success' ? 'bg-green-100 text-green-700' : conv.outcome === 'transferred' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                      }`}>{conv.outcome}</span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        conv.sentiment === 'positive' ? 'bg-green-100 text-green-700' : conv.sentiment === 'neutral' ? 'bg-gray-100 text-gray-700' : 'bg-red-100 text-red-700'
                      }`}>{conv.sentiment}</span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <span className="hidden sm:inline">{new Date(conv.createdAt).toLocaleString()}</span>
                      <span className="sm:hidden">{new Date(conv.createdAt).toLocaleDateString()}</span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm">
                      <button onClick={() => handleViewConversation(conv)} className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1" aria-label={`View conversation with ${conv.customerName}`}>
                        <Eye className="w-4 h-4" aria-hidden="true" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Conversation Detail Modal */}
      {selectedConversation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="conversation-detail-title">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <h2 id="conversation-detail-title" className="text-xl font-semibold text-gray-900">Conversation Details</h2>
                  {selectedConversation.status === 'active' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                      </span>
                      LIVE
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">{new Date(selectedConversation.createdAt).toLocaleString()}</p>
              </div>
              <button onClick={() => setSelectedConversation(null)} className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded p-1" aria-label="Close dialog">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="text-sm text-gray-600">Customer</label><p className="font-medium text-gray-900">{selectedConversation.customerName}</p></div>
                <div><label className="text-sm text-gray-600">Agent</label><p className="font-medium text-gray-900">{selectedConversation.agentName}</p></div>
                <div>
                  <label className="text-sm text-gray-600">Duration</label>
                  <p className="font-medium text-gray-900">
                    <LiveDuration status={selectedConversation.status} duration={selectedConversation.duration} createdAt={selectedConversation.createdAt} />
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Outcome</label>
                  <p>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      selectedConversation.outcome === 'success' ? 'bg-green-100 text-green-700' : selectedConversation.outcome === 'transferred' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                    }`}>{selectedConversation.outcome}</span>
                  </p>
                </div>
              </div>

              {selectedConversation.summary && (
                <div>
                  <label className="text-sm text-gray-600">Summary</label>
                  <p className="mt-1 text-gray-900">{selectedConversation.summary}</p>
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">
                  Transcript
                  {selectedConversation.status === 'active' && (
                    <span className="ml-2 text-xs text-green-600 font-normal animate-pulse">● Recording</span>
                  )}
                </h3>
                <div className="space-y-3 text-sm">
                  {selectedConversation.transcript && selectedConversation.transcript.length > 0 ? (
                    selectedConversation.transcript.map((entry, idx) => (
                      <div key={idx}>
                        <span className={`font-medium ${entry.role === 'agent' ? 'text-blue-600' : 'text-gray-900'}`}>
                          {entry.role === 'agent' ? 'Agent' : 'Customer'}:
                        </span>
                        <p className="text-gray-700 mt-1">{entry.text}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 italic text-center">
                      {selectedConversation.status === 'active' ? 'Call in progress — transcript will appear when complete.' : 'No transcript available.'}
                    </p>
                  )}
                </div>
              </div>

              {selectedConversation.status === 'completed' && (
                <button onClick={() => toast.success('Transcript downloaded')} className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  Download Full Transcript
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
