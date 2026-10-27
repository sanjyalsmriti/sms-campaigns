import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../utils/api';
import Layout from '../components/Layout';

const statusColors = {
  PENDING: 'text-gray-500',
  SENT: 'text-green-600',
  FAILED: 'text-red-600',
};

export default function CampaignReport() {
  const { id } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  const fetchCampaign = async () => {
    try {
      const data = await api.get(`/campaigns/${id}`);
      setCampaign(data);

      // Stop polling once campaign is no longer sending
      if (data.status !== 'SENDING' && data.status !== 'SCHEDULED') {
        clearInterval(intervalRef.current);
      }
    } catch {
      clearInterval(intervalRef.current);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaign();
    intervalRef.current = setInterval(fetchCampaign, 2000);
    return () => clearInterval(intervalRef.current);
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <p className="text-gray-500">Loading...</p>
      </Layout>
    );
  }

  if (!campaign) {
    return (
      <Layout>
        <p className="text-red-600">Campaign not found.</p>
      </Layout>
    );
  }

  const processed = campaign.sentCount + campaign.failedCount;
  const pct = campaign.totalContacts > 0 ? Math.round((processed / campaign.totalContacts) * 100) : 0;

  return (
    <Layout>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/" className="text-blue-600 hover:underline text-sm">&larr; Campaigns</Link>
        <h1 className="text-xl font-bold">Campaign #{campaign.id}</h1>
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            campaign.status === 'SENDING'
              ? 'bg-blue-100 text-blue-700'
              : campaign.status === 'COMPLETED'
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          {campaign.status}
        </span>
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded shadow p-5 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Progress</span>
          <span className="text-sm text-gray-500">{pct}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="bg-blue-600 h-4 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {processed} of {campaign.totalContacts} processed
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded shadow p-4 text-center">
          <p className="text-2xl font-bold">{campaign.totalContacts}</p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
        <div className="bg-white rounded shadow p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{campaign.sentCount}</p>
          <p className="text-xs text-gray-500">Sent</p>
        </div>
        <div className="bg-white rounded shadow p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{campaign.failedCount}</p>
          <p className="text-xs text-gray-500">Failed</p>
        </div>
        <div className="bg-white rounded shadow p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{campaign.creditsUsed}</p>
          <p className="text-xs text-gray-500">Credits Used</p>
        </div>
      </div>

      {/* Message template */}
      <div className="bg-white rounded shadow p-5 mb-6">
        <h2 className="font-semibold mb-2">Message Template</h2>
        <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded">
          {campaign.message}
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Group: {campaign.group?.name}
          {campaign.scheduledAt && ` · Scheduled: ${new Date(campaign.scheduledAt).toLocaleString()}`}
        </p>
      </div>

      {/* Message details */}
      {campaign.messages?.length > 0 && (
        <div className="bg-white rounded shadow overflow-hidden">
          <h2 className="font-semibold p-5 pb-3">Delivery Details</h2>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Parts</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Route</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {campaign.messages.map((m) => (
                <tr key={m.id}>
                  <td className="px-4 py-3">{m.contactName}</td>
                  <td className="px-4 py-3 text-gray-600">{m.contactPhone}</td>
                  <td className="px-4 py-3">{m.parts}</td>
                  <td className={`px-4 py-3 font-medium ${statusColors[m.status]}`}>
                    {m.status}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{m.route || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}
