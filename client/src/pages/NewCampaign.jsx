import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

export default function NewCampaign() {
  const [groups, setGroups] = useState([]);
  const [groupId, setGroupId] = useState('');
  const [message, setMessage] = useState('');
  const [sendLater, setSendLater] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [preview, setPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { refreshUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/groups').then(setGroups);
  }, []);

  // Debounced preview
  const fetchPreview = useCallback(async () => {
    if (!groupId || !message.trim()) {
      setPreview(null);
      return;
    }
    setLoadingPreview(true);
    try {
      const data = await api.post('/campaigns/preview', {
        groupId: parseInt(groupId),
        message,
      });
      setPreview(data);
    } catch {
      setPreview(null);
    } finally {
      setLoadingPreview(false);
    }
  }, [groupId, message]);

  useEffect(() => {
    const timer = setTimeout(fetchPreview, 400);
    return () => clearTimeout(timer);
  }, [fetchPreview]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const body = {
        groupId: parseInt(groupId),
        message,
      };
      if (sendLater && scheduledAt) {
        body.scheduledAt = new Date(scheduledAt).toISOString();
      }

      const campaign = await api.post('/campaigns', body);
      await refreshUser();
      navigate(`/campaigns/${campaign.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <h1 className="text-xl font-bold mb-6">New Campaign</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={handleSubmit} className="bg-white rounded shadow p-5 space-y-4">
          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div>
            <label className="block text-sm font-medium mb-1">Contact Group</label>
            <select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
              required
            >
              <option value="">Select a group</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g._count.contacts} contacts)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm h-32 resize-y"
              placeholder="Hello {name}, your appointment is confirmed."
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Use <code className="bg-gray-100 px-1 rounded">{'{name}'}</code> to personalise each message.
            </p>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={sendLater}
                onChange={(e) => setSendLater(e.target.checked)}
              />
              Schedule for later
            </label>
            {sendLater && (
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm mt-2"
                required
              />
            )}
          </div>

          <button
            type="submit"
            disabled={submitting || !groupId || !message.trim()}
            className="w-full bg-blue-600 text-white py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting
              ? 'Creating...'
              : sendLater
              ? 'Schedule Campaign'
              : 'Send Now'}
          </button>
        </form>

        {/* Live Cost Preview */}
        <div className="bg-white rounded shadow p-5">
          <h2 className="font-semibold mb-3">Cost Preview</h2>

          {!groupId || !message.trim() ? (
            <p className="text-gray-400 text-sm">Select a group and type a message to see the cost preview.</p>
          ) : loadingPreview ? (
            <p className="text-gray-400 text-sm">Calculating...</p>
          ) : preview ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-blue-50 rounded p-3">
                  <p className="text-2xl font-bold text-blue-700">{preview.totalContacts}</p>
                  <p className="text-xs text-gray-500">Contacts</p>
                </div>
                <div className="bg-blue-50 rounded p-3">
                  <p className="text-2xl font-bold text-blue-700">{preview.totalParts}</p>
                  <p className="text-xs text-gray-500">Total Parts</p>
                </div>
                <div className="bg-blue-50 rounded p-3">
                  <p className="text-2xl font-bold text-blue-700">{preview.totalCost}</p>
                  <p className="text-xs text-gray-500">Credits</p>
                </div>
              </div>

              {preview.breakdown?.length > 0 && (
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 text-left sticky top-0">
                      <tr>
                        <th className="px-3 py-2 font-medium">Name</th>
                        <th className="px-3 py-2 font-medium">Chars</th>
                        <th className="px-3 py-2 font-medium">Encoding</th>
                        <th className="px-3 py-2 font-medium">Parts</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {preview.breakdown.map((b, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2">{b.name}</td>
                          <td className="px-3 py-2">{b.resolvedLength}</td>
                          <td className="px-3 py-2">{b.encoding}</td>
                          <td className="px-3 py-2">{b.parts}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </Layout>
  );
}
