import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [topupAmounts, setTopupAmounts] = useState({});
  const [topupError, setTopupError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [usersData, routesData] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/routes'),
      ]);
      setUsers(usersData);
      setRoutes(routesData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTopup = async (userId) => {
    const amount = parseFloat(topupAmounts[userId]);
    if (!amount || amount <= 0) return;

    setTopupError('');
    try {
      await api.post(`/admin/users/${userId}/topup`, { amount });
      setTopupAmounts((prev) => ({ ...prev, [userId]: '' }));
      loadData();
    } catch (err) {
      setTopupError(err.message);
    }
  };

  if (loading) {
    return (
      <Layout>
        <p className="text-sm text-slate-500">Loading...</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader
        title="Admin"
        subtitle="Route health and user credit balances."
      />

      <div className="card mb-6 overflow-hidden">
        <h2 className="px-5 pb-3 pt-5 text-sm font-semibold">Route health</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-y border-slate-200 bg-slate-50/60">
              <tr>
                <th className="th">Route</th>
                <th className="th">Priority</th>
                <th className="th">Balance</th>
                <th className="th">Failure rate</th>
                <th className="th">Messages</th>
                <th className="th">Success rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {routes.map((r) => (
                <tr key={r.id} className="transition-colors hover:bg-slate-50/80">
                  <td className="td font-medium text-slate-900">{r.name}</td>
                  <td className="td tabular-nums">{r.priority}</td>
                  <td className="td tabular-nums">{r.balance}</td>
                  <td className="td tabular-nums">{(r.failureRate * 100).toFixed(0)}%</td>
                  <td className="td tabular-nums">{r.totalSent}</td>
                  <td className="td tabular-nums">
                    {r.successRate === 'N/A' ? (
                      <span className="text-slate-400">N/A</span>
                    ) : (
                      <span className="font-medium text-emerald-700">{r.successRate}%</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 pb-3 pt-5">
          <h2 className="text-sm font-semibold">Users</h2>
          {topupError && <p className="text-sm text-red-600">{topupError}</p>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-y border-slate-200 bg-slate-50/60">
              <tr>
                <th className="th">Name</th>
                <th className="th">Email</th>
                <th className="th">Role</th>
                <th className="th">Credits</th>
                <th className="th">Top up</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="transition-colors hover:bg-slate-50/80">
                  <td className="td font-medium text-slate-900">{u.name}</td>
                  <td className="td text-slate-500">{u.email}</td>
                  <td className="td">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                        u.role === 'ADMIN'
                          ? 'bg-violet-50 text-violet-700 ring-violet-600/20'
                          : 'bg-slate-100 text-slate-600 ring-slate-500/20'
                      }`}
                    >
                      {u.role === 'ADMIN' ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td className="td font-medium tabular-nums text-slate-900">{u.credits}</td>
                  <td className="td">
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="1"
                        placeholder="Amount"
                        value={topupAmounts[u.id] || ''}
                        onChange={(e) =>
                          setTopupAmounts((prev) => ({ ...prev, [u.id]: e.target.value }))
                        }
                        className="input w-28 py-1.5"
                      />
                      <button onClick={() => handleTopup(u.id)} className="btn-secondary">
                        Add
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
