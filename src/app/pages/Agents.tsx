import { useState, useEffect } from 'react';
import { Plus, MoreVertical, Play, Pause, Settings, Trash2, Bot, Phone, PhoneOff } from 'lucide-react';
import { agents as agentsApi, type Agent } from '../services/api';
import { toast } from 'sonner';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { LoadingSpinner } from '../components/LoadingSpinner';

export function Agents() {
  const [agentList, setAgentList] = useState<Agent[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [callingAgentId, setCallingAgentId] = useState<string | null>(null);

  // Call modal state
  const [callModalAgent, setCallModalAgent] = useState<Agent | null>(null);
  const [callPhoneNumber, setCallPhoneNumber] = useState('');

  // Form state
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState('Lead Qualification');
  const [formLanguage, setFormLanguage] = useState('English');
  const [formVoice, setFormVoice] = useState('Professional Male');
  const [formInstructions, setFormInstructions] = useState('');
  const [formPhoneNumber, setFormPhoneNumber] = useState('');

  useEffect(() => {
    loadAgents();
  }, []);

  async function loadAgents() {
    try {
      const data = await agentsApi.list();
      setAgentList(data);
    } catch {
      console.warn('API unavailable');
    } finally {
      setPageLoading(false);
    }
  }

  const handleToggleAgent = async (agentId: string, agentName: string, currentStatus: string) => {
    try {
      const updated = await agentsApi.toggle(agentId);
      setAgentList(prev => prev.map(a => (a._id === agentId ? updated : a)));
      const newStatus = updated.status === 'active' ? 'activated' : 'paused';
      toast.success(`${agentName} ${newStatus} successfully`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to toggle agent');
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    setIsLoading(true);
    try {
      await agentsApi.delete(agentId);
      setAgentList(prev => prev.filter(a => a._id !== agentId));
      toast.success('Agent deleted successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete agent');
    } finally {
      setDeleteConfirm(null);
      setIsLoading(false);
    }
  };

  const handleCreateAgent = async () => {
    if (!formName.trim()) {
      toast.error('Agent name is required');
      return;
    }
    setIsLoading(true);
    try {
      const newAgent = await agentsApi.create({
        name: formName,
        type: formType,
        language: formLanguage,
        voice: formVoice,
        instructions: formInstructions || undefined,
        phoneNumber: formPhoneNumber || undefined,
      });
      setAgentList(prev => [newAgent, ...prev]);
      toast.success('New agent created successfully');
      setShowCreateModal(false);
      setFormName('');
      setFormInstructions('');
      setFormPhoneNumber('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create agent');
    } finally {
      setIsLoading(false);
    }
  };

  const openCallModal = (agent: Agent) => {
    setCallModalAgent(agent);
    setCallPhoneNumber(agent.phoneNumber || '');
  };

  const handleStartCall = async () => {
    if (!callModalAgent) return;
    const phoneNumber = callPhoneNumber.trim();
    if (!phoneNumber) {
      toast.error('Enter a phone number to call (with country code, e.g. +918148375380)');
      return;
    }
    setCallingAgentId(callModalAgent._id);
    setCallModalAgent(null);
    try {
      const result = await agentsApi.startCall(callModalAgent._id, phoneNumber);
      toast.success(result.message || `Calling ${phoneNumber}...`);
      loadAgents();
    } catch (err: any) {
      toast.error(err.message || 'Failed to start call');
    } finally {
      setCallingAgentId(null);
    }
  };

  if (pageLoading) {
    return <div className="flex items-center justify-center h-64"><LoadingSpinner /></div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">Voice Agents</h1>
          <p className="text-gray-600 mt-1">Manage and configure your AI voice agents</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          aria-label="Create new agent"
        >
          <Plus className="w-5 h-5" aria-hidden="true" />
          <span>Create Agent</span>
        </button>
      </div>

      {agentList.length === 0 ? (
        <EmptyState
          icon={Bot}
          title="No agents yet"
          description="Create your first voice agent to start handling calls automatically."
          action={{ label: 'Create Agent', onClick: () => setShowCreateModal(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {agentList.map((agent) => (
            <div key={agent._id} className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">{agent.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{agent.type}</p>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                      agent.status === 'active' ? 'bg-green-100 text-green-700'
                        : agent.status === 'training' ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                    role="status"
                    aria-label={`Status: ${agent.status}`}
                  >
                    {agent.status}
                  </span>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Calls Handled</span>
                  <span className="font-medium text-gray-900">{agent.callsHandled.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Avg Duration</span>
                  <span className="font-medium text-gray-900">{agent.avgDuration}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Success Rate</span>
                  <span className="font-medium text-gray-900">{agent.successRate}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Language</span>
                  <span className="font-medium text-gray-900">{agent.language}</span>
                </div>
                {agent.phoneNumber && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Phone</span>
                    <span className="font-medium text-gray-900">{agent.phoneNumber}</span>
                  </div>
                )}
              </div>

              {agent.instructions && (
                <div className="mb-4 p-2 bg-gray-50 rounded text-xs text-gray-600 line-clamp-2" title={agent.instructions}>
                  {agent.instructions}
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <button
                  onClick={() => openCallModal(agent)}
                  disabled={callingAgentId === agent._id}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Start call"
                >
                  {callingAgentId === agent._id ? (
                    <><LoadingSpinner size="sm" /><span>Calling...</span></>
                  ) : (
                    <><Phone className="w-4 h-4" aria-hidden="true" /><span>Call</span></>
                  )}
                </button>
                <button
                  onClick={() => handleToggleAgent(agent._id, agent.name, agent.status)}
                  className={`px-3 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    agent.status === 'active' ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                  }`}
                  aria-label={agent.status === 'active' ? 'Pause agent' : 'Activate agent'}
                >
                  {agent.status === 'active' ? <Pause className="w-4 h-4" aria-hidden="true" /> : <Play className="w-4 h-4" aria-hidden="true" />}
                </button>
                <button
                  onClick={() => setDeleteConfirm(agent._id)}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  aria-label="Delete agent"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Agent Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="create-agent-title">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 id="create-agent-title" className="text-xl font-semibold text-gray-900 mb-4">Create New Agent</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="agent-name" className="block text-sm font-medium text-gray-700 mb-1">Agent Name</label>
                <input id="agent-name" type="text" placeholder="e.g., Customer Support Bot" value={formName} onChange={(e) => setFormName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label htmlFor="agent-type" className="block text-sm font-medium text-gray-700 mb-1">Agent Type</label>
                <select id="agent-type" value={formType} onChange={(e) => setFormType(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Lead Qualification</option>
                  <option>Customer Support</option>
                  <option>Scheduling</option>
                  <option>Surveys</option>
                  <option>Demos</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="agent-language" className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                  <select id="agent-language" value={formLanguage} onChange={(e) => setFormLanguage(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>English</option>
                    <option>Spanish</option>
                    <option>French</option>
                    <option>German</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="agent-voice" className="block text-sm font-medium text-gray-700 mb-1">Voice</label>
                  <select id="agent-voice" value={formVoice} onChange={(e) => setFormVoice(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Professional Male</option>
                    <option>Professional Female</option>
                    <option>Friendly Male</option>
                    <option>Friendly Female</option>
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="agent-phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input id="agent-phone" type="tel" placeholder="+918148375380" value={formPhoneNumber} onChange={(e) => setFormPhoneNumber(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <p className="text-xs text-gray-500 mt-1">The number the agent will call (with country code)</p>
              </div>
              <div>
                <label htmlFor="agent-instructions" className="block text-sm font-medium text-gray-700 mb-1">System Prompt (Instructions)</label>
                <textarea
                  id="agent-instructions"
                  rows={4}
                  placeholder="You are a helpful voice AI assistant that helps customers with..."
                  value={formInstructions}
                  onChange={(e) => setFormInstructions(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
                />
                <p className="text-xs text-gray-500 mt-1">Custom instructions for the AI agent. Leave blank for default behavior.</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCreateModal(false)} disabled={isLoading} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50">Cancel</button>
              <button onClick={handleCreateAgent} disabled={isLoading} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex items-center justify-center gap-2">
                {isLoading ? <LoadingSpinner size="sm" /> : null}
                Create Agent
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        title="Delete Agent"
        message="Are you sure you want to delete this agent? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={() => { if (deleteConfirm) handleDeleteAgent(deleteConfirm); }}
        onCancel={() => setDeleteConfirm(null)}
      />

      {/* Call Modal */}
      {callModalAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="call-modal-title">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Phone className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 id="call-modal-title" className="text-lg font-semibold text-gray-900">Place a Call</h2>
                <p className="text-sm text-gray-500">Agent: {callModalAgent.name}</p>
              </div>
            </div>
            <div className="mb-5">
              <label htmlFor="call-phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                id="call-phone"
                type="tel"
                autoFocus
                placeholder="+918148375380"
                value={callPhoneNumber}
                onChange={(e) => setCallPhoneNumber(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleStartCall()}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-lg tracking-wide"
              />
              <p className="text-xs text-gray-500 mt-1">Include country code (e.g. +91 for India)</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setCallModalAgent(null); setCallPhoneNumber(''); }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStartCall}
                disabled={!callPhoneNumber.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Phone className="w-4 h-4" />
                Call Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
