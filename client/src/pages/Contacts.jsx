import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import Layout from '../components/Layout';

export default function Contacts() {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [contacts, setContacts] = useState([]);
  const [file, setFile] = useState(null);
  const [groupName, setGroupName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState('');

  const loadGroups = () => api.get('/groups').then(setGroups);

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      api.get(`/contacts?groupId=${selectedGroup}`).then(setContacts);
    } else {
      setContacts([]);
    }
  }, [selectedGroup]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !groupName.trim()) return;

    setUploading(true);
    setError('');
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('groupName', groupName.trim());

      const result = await api.post('/contacts/upload', formData);
      setUploadResult(result);
      setFile(null);
      setGroupName('');
      loadGroups();
      if (result.groupId) setSelectedGroup(result.groupId.toString());
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Layout>
      <h1 className="text-xl font-bold mb-6">Contacts</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload CSV */}
        <div className="bg-white rounded shadow p-5">
          <h2 className="font-semibold mb-4">Upload CSV</h2>
          <form onSubmit={handleUpload} className="space-y-3">
            <input
              type="text"
              placeholder="Group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
              required
            />
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full text-sm"
              required
            />
            <p className="text-xs text-gray-500">CSV should have columns: name, phone</p>
            <button
              type="submit"
              disabled={uploading}
              className="w-full bg-blue-600 text-white py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </form>

          {error && <p className="mt-3 text-red-600 text-sm">{error}</p>}

          {uploadResult && (
            <div className="mt-4 p-3 bg-green-50 rounded text-sm space-y-1">
              <p className="font-medium text-green-800">Upload complete</p>
              <p>Added: {uploadResult.added}</p>
              <p>Duplicates in file: {uploadResult.duplicatesInFile}</p>
              <p>Already in group: {uploadResult.duplicatesInGroup}</p>
              <p>Invalid numbers: {uploadResult.invalid}</p>
              {uploadResult.errors?.length > 0 && (
                <div className="mt-2">
                  <p className="font-medium text-red-700">Rejected:</p>
                  {uploadResult.errors.map((e, i) => (
                    <p key={i} className="text-red-600">
                      {e.row}: {e.reason}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Groups + Contacts */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded shadow p-5">
            <h2 className="font-semibold mb-3">Groups</h2>
            {groups.length === 0 ? (
              <p className="text-gray-500 text-sm">No groups yet. Upload a CSV to create one.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {groups.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setSelectedGroup(g.id.toString())}
                    className={`px-3 py-1.5 rounded text-sm border ${
                      selectedGroup === g.id.toString()
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    {g.name} ({g._count.contacts})
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedGroup && (
            <div className="bg-white rounded shadow overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Phone</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {contacts.map((c) => (
                    <tr key={c.id}>
                      <td className="px-4 py-3">{c.name}</td>
                      <td className="px-4 py-3 text-gray-600">{c.phone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {contacts.length === 0 && (
                <p className="text-gray-500 text-sm p-4">No contacts in this group.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
