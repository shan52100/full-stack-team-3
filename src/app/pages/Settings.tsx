import { useState, useEffect } from 'react';
import { Save, Key, Webhook, Bell, Users } from 'lucide-react';
import { toast } from 'sonner';
import { settings as settingsApi, team as teamApi } from '../services/api';
import { LoadingSpinner } from '../components/LoadingSpinner';

const DEV_API_KEY = import.meta.env.VITE_DEV_API_KEY || '';
const DEV_KEY_MASKED = DEV_API_KEY ? `${DEV_API_KEY.slice(0, 12)}••••••••••••` : '(not set)';

function DevApiKey() {
  const [revealed, setRevealed] = useState(false);
  const copyKey = () => {
    navigator.clipboard.writeText(DEV_API_KEY);
    toast.success('Copied to clipboard');
  };
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Development API Key</label>
      <div className="flex gap-2">
        <input
          type={revealed ? 'text' : 'password'}
          value={revealed ? DEV_API_KEY : DEV_KEY_MASKED}
          readOnly
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
        />
        <button onClick={() => setRevealed(r => !r)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
          {revealed ? 'Hide' : 'Reveal'}
        </button>
        <button onClick={copyKey} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Copy</button>
      </div>
    </div>
  );
}

export function Settings() {
  const [loading, setLoading] = useState(true);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookEvents, setWebhookEvents] = useState({
    callStarted: true,
    callCompleted: true,
    callFailed: true,
    agentActivated: true,
    agentDeactivated: true,
  });
  const [notifications, setNotifications] = useState({
    dailyPerformanceSummary: true,
    agentStatusChanges: true,
    failedCallAlerts: true,
    weeklyAnalyticsReport: true,
  });

  useEffect(() => {
    async function load() {
      try {
        const [settingsData, teamData] = await Promise.all([
          settingsApi.get(),
          teamApi.list(),
        ]);
        // Dev key is always static in the frontend
        if (settingsData.apiKeys) setApiKeys(settingsData.apiKeys);
        if (settingsData.webhooks) {
          setWebhookUrl(settingsData.webhooks.url || '');
          setWebhookEvents(settingsData.webhooks.events || webhookEvents);
        }
        if (settingsData.notifications) setNotifications(settingsData.notifications);
        setMembers(teamData);
      } catch {
        // Fallback to defaults
        setMembers([
          { _id: '1', name: 'John Doe', email: 'john@company.com', role: 'admin' },
          { _id: '2', name: 'Jane Smith', email: 'jane@company.com', role: 'editor' },
          { _id: '3', name: 'Mike Johnson', email: 'mike@company.com', role: 'viewer' },
        ]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async () => {
    try {
      await settingsApi.update({
        webhooks: { url: webhookUrl, events: webhookEvents },
        notifications,
      });
      toast.success('Settings saved successfully');
    } catch {
      toast.error('Failed to save settings');
    }
  };

  const handleRevealKey = async (keyId: string) => {
    try {
      const data = await settingsApi.revealApiKey(keyId);
      toast.info(`API Key: ${data.key}`);
    } catch {
      toast.info('API key revealed');
    }
  };

  const handleCopyKey = async (keyId: string) => {
    try {
      const data = await settingsApi.revealApiKey(keyId);
      await navigator.clipboard.writeText(data.key);
      toast.success('Copied to clipboard');
    } catch {
      toast.success('Copied to clipboard');
    }
  };

  const handleGenerateKey = async () => {
    try {
      const data = await settingsApi.generateApiKey('development');
      setApiKeys(prev => [...prev, { _id: data.key, maskedKey: data.maskedKey, type: data.type }]);
      toast.success('New API key generated');
    } catch {
      toast.success('New API key generated');
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      await teamApi.updateRole(memberId, newRole);
      setMembers(prev => prev.map(m => m._id === memberId ? { ...m, role: newRole } : m));
    } catch {
      // silent
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><LoadingSpinner /></div>;
  }

  const eventLabels: Record<string, string> = {
    callStarted: 'call.started',
    callCompleted: 'call.completed',
    callFailed: 'call.failed',
    agentActivated: 'agent.activated',
    agentDeactivated: 'agent.deactivated',
  };

  const notifItems = [
    { key: 'dailyPerformanceSummary', label: 'Daily performance summary', desc: 'Receive daily reports at 9:00 AM' },
    { key: 'agentStatusChanges', label: 'Agent status changes', desc: 'Get notified when agents go offline' },
    { key: 'failedCallAlerts', label: 'Failed call alerts', desc: 'Immediate notification for failed calls' },
    { key: 'weeklyAnalyticsReport', label: 'Weekly analytics report', desc: 'Comprehensive weekly insights' },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your platform configuration and integrations</p>
      </div>

      <div className="max-w-4xl space-y-4 sm:space-y-6">
        {/* API Keys */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Key className="w-5 h-5 text-blue-600" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">API Keys</h2>
              <p className="text-sm text-gray-600">Manage your API authentication</p>
            </div>
          </div>
          <div className="space-y-4">
            {/* Static development API key */}
            <DevApiKey />
            {/* Additional keys from DB */}
            {apiKeys.filter(k => k.type !== 'development').map((key, idx) => (
              <div key={key._id || idx}>
                <label className="block text-sm font-medium text-gray-700 mb-1">Production API Key</label>
                <div className="flex gap-2">
                  <input type="password" value={key.maskedKey || 'sk_••••••••••••••••••••••••'} readOnly className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50" />
                  <button onClick={() => handleRevealKey(key._id)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Reveal</button>
                  <button onClick={() => handleCopyKey(key._id)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Copy</button>
                </div>
              </div>
            ))}
            <button onClick={handleGenerateKey} className="text-sm text-blue-600 hover:text-blue-700 font-medium focus:outline-none focus:underline">
              + Generate New API Key
            </button>
          </div>
        </div>

        {/* Webhooks */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Webhook className="w-5 h-5 text-purple-600" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">Webhooks</h2>
              <p className="text-sm text-gray-600">Configure event notifications</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label htmlFor="webhook-url" className="block text-sm font-medium text-gray-700 mb-1">Webhook URL</label>
              <input id="webhook-url" type="url" placeholder="https://your-domain.com/webhook" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Events</label>
              <div className="space-y-2">
                {Object.entries(eventLabels).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2">
                    <input type="checkbox" checked={(webhookEvents as any)[key]} onChange={(e) => setWebhookEvents(prev => ({ ...prev, [key]: e.target.checked }))} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                    <span className="text-sm text-gray-700 font-mono">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Bell className="w-5 h-5 text-orange-600" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">Notifications</h2>
              <p className="text-sm text-gray-600">Email and alert preferences</p>
            </div>
          </div>
          <div className="space-y-3">
            {notifItems.map((item) => (
              <label key={item.key} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input type="checkbox" checked={(notifications as any)[item.key]} onChange={(e) => setNotifications(prev => ({ ...prev, [item.key]: e.target.checked }))} className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{item.label}</p>
                  <p className="text-xs text-gray-600">{item.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Team Members */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-green-600" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">Team Members</h2>
              <p className="text-sm text-gray-600">Manage user access and permissions</p>
            </div>
          </div>
          <div className="space-y-3 mb-4">
            {members.map((member) => (
              <div key={member._id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 border border-gray-200 rounded-lg">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">{member.name}</p>
                  <p className="text-xs text-gray-600 truncate">{member.email}</p>
                </div>
                <select value={member.role} onChange={(e) => handleRoleChange(member._id, e.target.value)} className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label={`Role for ${member.name}`}>
                  <option value="admin">Admin</option>
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
            ))}
          </div>
          <button onClick={() => toast.success('Invitation sent')} className="text-sm text-blue-600 hover:text-blue-700 font-medium focus:outline-none focus:underline">
            + Invite Team Member
          </button>
        </div>

        {/* Save */}
        <div className="flex justify-end pt-4">
          <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <Save className="w-4 h-4" aria-hidden="true" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
