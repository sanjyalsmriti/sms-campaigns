import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';

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
      <PageHeader
        title="New campaign"
        subtitle="Pick a group, write your message and check the cost before sending."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <form onSubmit={handleSubmit} className="card h-fit space-y-5 p-5">
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <div>
            <label htmlFor="group" className="label">Contact group</label>
            <select
              id="group"
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="input"
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
            <label htmlFor="message" className="label">Message</label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="input h-32 resize-y"
              placeholder="Hello {name}, your appointment is confirmed."
              required
            />
            <p className="mt-1.5 text-xs text-slate-500">
              Use <code className="rounded bg-slate-100 px-1 py-0.5 text-slate-700">{'{name}'}</code> to
              insert each contact's name.
            </p>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={sendLater}
                onChange={(e) => setSendLater(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              Schedule for later
            </label>
            {sendLater && (
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="input mt-2"
                required
              />
            )}
          </div>

          <button
            type="submit"
            disabled={submitting || !groupId || !message.trim()}
            className="btn-primary w-full"
          >
            {submitting ? 'Creating...' : sendLater ? 'Schedule campaign' : 'Send now'}
          </button>
        </form>

        <div className="card h-fit p-5">
          <h2 className="mb-4 text-sm font-semibold">Cost preview</h2>

          {!groupId || !message.trim() ? (
            <p className="text-sm text-slate-400">Select a group and type a message to see the cost.</p>
          ) : loadingPreview ? (
            <p className="text-sm text-slate-400">Calculating...</p>
          ) : preview ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
                  <p className="text-xs text-slate-500">Contacts</p>
                  <p className="mt-0.5 text-xl font-semibold tracking-tight">{preview.totalContacts}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
                  <p className="text-xs text-slate-500">Total parts</p>
                  <p className="mt-0.5 text-xl font-semibold tracking-tight">{preview.totalParts}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
                  <p className="text-xs text-slate-500">Credits</p>
                  <p className="mt-0.5 text-xl font-semibold tracking-tight">{preview.totalCost}</p>
                </div>
              </div>

              {preview.breakdown?.length > 0 && (
                <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-200">
                  <table className="w-full">
                    <thead className="sticky top-0 border-b border-slate-200 bg-slate-50">
                      <tr>
                        <th className="th py-2">Name</th>
                        <th className="th py-2">Chars</th>
                        <th className="th py-2">Encoding</th>
                        <th className="th py-2">Parts</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {preview.breakdown.map((b, i) => (
                        <tr key={i}>
                          <td className="td py-2">{b.name}</td>
                          <td className="td py-2 tabular-nums">{b.resolvedLength}</td>
                          <td className="td py-2">{b.encoding}</td>
                          <td className="td py-2 tabular-nums">{b.parts}</td>
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
