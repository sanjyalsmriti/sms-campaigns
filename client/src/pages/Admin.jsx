import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import Layout from '../components/Layout';

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
        <p className="text-gray-500">Loading...</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <h1 className="text-xl font-bold mb-6">Admin Panel</h1>

      <div className="bg-white rounded shadow overflow-hidden mb-6">
        <h2 className="font-semibold p-5 pb-3">Route Health</h2>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Route</th>
              <th className="px-4 py-3 font-medium">Priority</th>
              <th className="px-4 py-3 font-medium">Balance</th>
              <th className="px-4 py-3 font-medium">Failure Rate</th>
              <th className="px-4 py-3 font-medium">Messages Sent</th>
              <th className="px-4 py-3 font-medium">Success Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {routes.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3 font-medium">{r.name}</td>
                <td className="px-4 py-3">{r.priority}</td>
                <td className="px-4 py-3">{r.balance}</td>
                <td className="px-4 py-3">{(r.failureRate * 100).toFixed(0)}%</td>
                <td className="px-4 py-3">{r.totalSent}</td>
                <td className="px-4 py-3">
                  {r.successRate === 'N/A' ? (
                    <span className="text-gray-400">N/A</span>
                  ) : (
                    <span className="text-green-600">{r.successRate}%</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded shadow overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="font-semibold">Users</h2>
          {topupError && <p className="text-sm text-red-600">{topupError}</p>}
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Credits</th>
              <th className="px-4 py-3 font-medium">Top Up</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3">{u.name}</td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      u.role === 'ADMIN'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium">{u.credits}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      placeholder="Amount"
                      value={topupAmounts[u.id] || ''}
                      onChange={(e) =>
                        setTopupAmounts((prev) => ({ ...prev, [u.id]: e.target.value }))
                      }
                      className="border rounded px-2 py-1 text-sm w-24"
                    />
                    <button
                      onClick={() => handleTopup(u.id)}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                    >
                      Add
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
