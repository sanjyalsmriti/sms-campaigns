import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';

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
      <PageHeader
        title="Contacts"
        subtitle="Upload a CSV of names and phone numbers to build a group."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card h-fit p-5">
          <h2 className="mb-4 text-sm font-semibold">Upload CSV</h2>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label htmlFor="groupName" className="label">Group name</label>
              <input
                id="groupName"
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="input"
                required
              />
            </div>
            <div>
              <label htmlFor="csvFile" className="label">CSV file</label>
              <input
                id="csvFile"
                type="file"
                accept=".csv"
                onChange={(e) => setFile(e.target.files[0])}
                className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
                required
              />
              <p className="mt-1.5 text-xs text-slate-500">Columns: name, phone</p>
            </div>
            <button type="submit" disabled={uploading} className="btn-primary w-full">
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </form>

          {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          {uploadResult && (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
              <p className="mb-1 font-medium">Upload complete</p>
              <ul className="space-y-0.5 text-emerald-800">
                <li>Added: {uploadResult.added}</li>
                <li>Duplicates in file: {uploadResult.duplicatesInFile}</li>
                <li>Already in group: {uploadResult.duplicatesInGroup}</li>
                <li>Invalid numbers: {uploadResult.invalid}</li>
              </ul>
              {uploadResult.errors?.length > 0 && (
                <div className="mt-2 border-t border-emerald-200 pt-2">
                  <p className="font-medium text-red-700">Rejected rows</p>
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

        <div className="space-y-4 lg:col-span-2">
          <div className="card p-5">
            <h2 className="mb-3 text-sm font-semibold">Groups</h2>
            {groups.length === 0 ? (
              <p className="text-sm text-slate-500">No groups yet. Upload a CSV to create one.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {groups.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setSelectedGroup(g.id.toString())}
                    className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                      selectedGroup === g.id.toString()
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {g.name} <span className="opacity-60">({g._count.contacts})</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedGroup && (
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead className="border-b border-slate-200 bg-slate-50/60">
                  <tr>
                    <th className="th">Name</th>
                    <th className="th">Phone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {contacts.map((c) => (
                    <tr key={c.id} className="transition-colors hover:bg-slate-50/80">
                      <td className="td font-medium text-slate-900">{c.name}</td>
                      <td className="td tabular-nums text-slate-500">{c.phone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {contacts.length === 0 && (
                <p className="p-4 text-sm text-slate-500">No contacts in this group.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
