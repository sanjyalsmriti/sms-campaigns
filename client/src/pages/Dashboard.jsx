import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import Layout from '../components/Layout';

const statusColors = {
  DRAFT: 'bg-gray-100 text-gray-700',
  SCHEDULED: 'bg-yellow-100 text-yellow-700',
  SENDING: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function Dashboard() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/campaigns').then(setCampaigns).finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Campaigns</h1>
        <Link
          to="/campaigns/new"
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700"
        >
          New Campaign
        </Link>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : campaigns.length === 0 ? (
        <div className="bg-white rounded shadow p-8 text-center text-gray-500">
          <p>No campaigns yet.</p>
          <Link to="/campaigns/new" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
            Create your first campaign
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">Group</th>
                <th className="px-4 py-3 font-medium">Message</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Progress</th>
                <th className="px-4 py-3 font-medium">Credits</th>
                <th className="px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {campaigns.map((c) => {
                const processed = c.sentCount + c.failedCount;
                const pct = c.totalContacts > 0 ? Math.round((processed / c.totalContacts) * 100) : 0;
                return (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link to={`/campaigns/${c.id}`} className="text-blue-600 hover:underline">
                        #{c.id}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{c.group?.name}</td>
                    <td className="px-4 py-3 max-w-xs truncate">{c.message}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[c.status]}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {c.sentCount}/{c.totalContacts} sent
                      {c.status === 'SENDING' && (
                        <div className="w-24 bg-gray-200 rounded-full h-1.5 mt-1">
                          <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">{c.creditsUsed}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}
