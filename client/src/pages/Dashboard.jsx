import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import ProgressBar from '../components/ProgressBar';
import { PlusIcon } from '../components/Icons';

function StatCard({ label, value }) {
  return (
    <div className="card px-5 py-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/campaigns').then(setCampaigns).finally(() => setLoading(false));
  }, []);

  const totalSent = campaigns.reduce((sum, c) => sum + c.sentCount, 0);
  const totalFailed = campaigns.reduce((sum, c) => sum + c.failedCount, 0);
  const active = campaigns.filter((c) => c.status === 'SENDING' || c.status === 'SCHEDULED').length;
  const deliveryRate =
    totalSent + totalFailed > 0 ? `${((totalSent / (totalSent + totalFailed)) * 100).toFixed(1)}%` : '—';

  return (
    <Layout>
      <PageHeader
        title="Campaigns"
        subtitle="Manage and track your outbound SMS broadcasts."
        action={
          <Link to="/campaigns/new" className="btn-primary">
            <PlusIcon />
            New campaign
          </Link>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total campaigns" value={campaigns.length} />
        <StatCard label="Active" value={active} />
        <StatCard label="Messages sent" value={totalSent.toLocaleString()} />
        <StatCard label="Delivery rate" value={deliveryRate} />
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : campaigns.length === 0 ? (
        <div className="card px-6 py-12 text-center">
          <p className="text-sm text-slate-500">No campaigns yet.</p>
          <Link to="/campaigns/new" className="link mt-2 inline-block text-sm">
            Create your first campaign
          </Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-200 bg-slate-50/60">
                <tr>
                  <th className="th">Campaign</th>
                  <th className="th">Message</th>
                  <th className="th">Status</th>
                  <th className="th w-48">Progress</th>
                  <th className="th">Credits</th>
                  <th className="th">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {campaigns.map((c) => {
                  const processed = c.sentCount + c.failedCount;
                  const pct = c.totalContacts > 0 ? Math.round((processed / c.totalContacts) * 100) : 0;
                  return (
                    <tr key={c.id} className="transition-colors hover:bg-slate-50/80">
                      <td className="td">
                        <Link to={`/campaigns/${c.id}`} className="font-medium text-slate-900 hover:underline">
                          Campaign #{c.id}
                        </Link>
                        <p className="text-xs text-slate-500">{c.group?.name}</p>
                      </td>
                      <td className="td max-w-xs truncate" title={c.message}>
                        {c.message}
                      </td>
                      <td className="td">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="td">
                        <div className="flex items-center gap-3">
                          <ProgressBar value={pct} />
                          <span className="shrink-0 text-xs tabular-nums text-slate-500">
                            {processed}/{c.totalContacts}
                          </span>
                        </div>
                      </td>
                      <td className="td tabular-nums">{c.creditsUsed}</td>
                      <td className="td text-slate-500">
                        {new Date(c.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
}
