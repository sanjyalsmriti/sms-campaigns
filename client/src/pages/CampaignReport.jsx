import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../utils/api';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import ProgressBar from '../components/ProgressBar';

function Stat({ label, value, tone = 'text-slate-900' }) {
  return (
    <div className="card px-5 py-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tracking-tight tabular-nums ${tone}`}>{value}</p>
    </div>
  );
}

export default function CampaignReport() {
  const { id } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  const fetchCampaign = async () => {
    try {
      const data = await api.get(`/campaigns/${id}`);
      setCampaign(data);

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
        <p className="text-sm text-slate-500">Loading...</p>
      </Layout>
    );
  }

  if (!campaign) {
    return (
      <Layout>
        <p className="text-sm text-red-600">Campaign not found.</p>
      </Layout>
    );
  }

  const processed = campaign.sentCount + campaign.failedCount;
  const pct = campaign.totalContacts > 0 ? Math.round((processed / campaign.totalContacts) * 100) : 0;

  return (
    <Layout>
      <Link to="/" className="link mb-3 inline-block text-sm">
        &larr; Back to campaigns
      </Link>

      <PageHeader
        title={`Campaign #${campaign.id}`}
        subtitle={`Group: ${campaign.group?.name}${
          campaign.scheduledAt ? ` · Scheduled for ${new Date(campaign.scheduledAt).toLocaleString()}` : ''
        }`}
        action={<StatusBadge status={campaign.status} />}
      />

      <div className="card mb-6 p-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium">Progress</span>
          <span className="text-sm tabular-nums text-slate-500">
            {processed} of {campaign.totalContacts} processed · {pct}%
          </span>
        </div>
        <ProgressBar value={pct} size="lg" />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Total" value={campaign.totalContacts} />
        <Stat label="Sent" value={campaign.sentCount} tone="text-emerald-600" />
        <Stat label="Failed" value={campaign.failedCount} tone="text-red-600" />
        <Stat label="Credits used" value={campaign.creditsUsed} />
      </div>

      <div className="card mb-6 p-5">
        <h2 className="mb-2 text-sm font-semibold">Message template</h2>
        <p className="whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
          {campaign.message}
        </p>
      </div>

      {campaign.messages?.length > 0 && (
        <div className="card overflow-hidden">
          <h2 className="px-5 pb-3 pt-5 text-sm font-semibold">Delivery details</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-y border-slate-200 bg-slate-50/60">
                <tr>
                  <th className="th">Contact</th>
                  <th className="th">Phone</th>
                  <th className="th">Parts</th>
                  <th className="th">Status</th>
                  <th className="th">Route</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {campaign.messages.map((m) => (
                  <tr key={m.id} className="transition-colors hover:bg-slate-50/80">
                    <td className="td font-medium text-slate-900">{m.contactName}</td>
                    <td className="td tabular-nums text-slate-500">{m.contactPhone}</td>
                    <td className="td tabular-nums">{m.parts}</td>
                    <td className="td">
                      <StatusBadge status={m.status} />
                    </td>
                    <td className="td text-slate-500">{m.route || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
}
