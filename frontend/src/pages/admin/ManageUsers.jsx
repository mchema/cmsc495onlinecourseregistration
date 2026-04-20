import { useEffect, useState } from 'react';
import {
  getUsers,
  createUser,
  updateUserRole,
  deleteUser,
} from '../../api/admin.js';

const EMPTY_FORM = {
  name: '',
  email: '',
  type: 'STUDENT',
  detail: '',
};

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ message: '', type: '' });
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');

      const data = await getUsers({ page: 1, limit: 25 });

      setUsers(data?.User || []);
      setMeta(data?.Meta || null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 3500);
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setForm({
      name: user.name,
      email: user.email,
      type: user.role || 'STUDENT',
      detail: user.role_details != null ? String(user.role_details) : '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setForm(EMPTY_FORM);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleTypeChange = (e) => {
    const nextType = e.target.value;
    setForm((prev) => ({
      ...prev,
      type: nextType,
      detail:
        nextType === 'ADMIN'
          ? '10'
          : '',
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingUser) {
        await updateUserRole(editingUser.id, {
          type: form.type,
          detail: form.detail,
        });

        showToast('User role updated successfully.');
      } else {
        await createUser({
          name: form.name,
          email: form.email,
          type: form.type,
          detail: form.detail,
        });

        showToast('User created successfully.');
      }

      closeModal();
      await fetchUsers();
    } catch (err) {
      showToast(
        err.response?.data?.error || 'Action failed. Please try again.',
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      await deleteUser(userId);
      showToast('User deleted.');
      await fetchUsers();
    } catch (err) {
      showToast(
        err.response?.data?.error || 'Failed to delete user.',
        'error'
      );
    }
  };

  const renderDetailLabel = (type) => {
    if (type === 'ADMIN') return 'Access Level';
    if (type === 'STUDENT') return 'Major';
    if (type === 'PROFESSOR') return 'Department';
    return 'Detail';
  };

  return (
    <div>
      {toast.message && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-500'
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Manage Users</h2>
          {meta && (
            <p className="text-sm text-gray-500 mt-1">
              Total users: {meta.total ?? users.length}
            </p>
          )}
        </div>
        <button onClick={openCreateModal} className="btn-primary">
          + Create User
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-600 text-sm rounded-lg px-4 py-3 mb-5">
          {error}
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      )}

      {!loading && users.length > 0 && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-5 py-3 text-left">Name</th>
                <th className="px-5 py-3 text-left">Email</th>
                <th className="px-5 py-3 text-left">Role</th>
                <th className="px-5 py-3 text-left">Detail</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((entry, index) => {
                const user = entry?.User || entry;
                return (
                  <tr key={user?.id ?? index} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-3 font-medium text-gray-800">{user?.name}</td>
                    <td className="px-5 py-3 text-gray-500">{user?.email}</td>
                    <td className="px-5 py-3">
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                        {user?.role}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500">{user?.role_details}</td>
                    <td className="px-5 py-3 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(user)}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Edit Role
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="text-red-500 hover:underline text-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading && users.length === 0 && !error && (
        <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
          <p className="font-medium">No users found.</p>
          <p className="text-sm mt-1">Create the first user to get started.</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 z-50">
            <h3 className="text-lg font-bold text-gray-800 mb-5">
              {editingUser ? 'Edit User Role' : 'Create New User'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingUser && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      className="input"
                      placeholder="Jane Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      className="input"
                      placeholder="jane@example.com"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  name="type"
                  value={form.type}
                  onChange={handleTypeChange}
                  className="input"
                >
                  <option value="STUDENT">Student</option>
                  <option value="ADMIN">Admin</option>
                  <option value="PROFESSOR">Professor</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {renderDetailLabel(form.type)}
                </label>
                <input
                  type="text"
                  name="detail"
                  value={form.detail}
                  onChange={handleChange}
                  required
                  className="input"
                  placeholder={
                    form.type === 'ADMIN'
                      ? '10'
                      : form.type === 'STUDENT'
                      ? 'Computer Science'
                      : 'Computer Science'
                  }
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="text-sm text-gray-500 hover:text-gray-700 transition px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting
                    ? 'Saving...'
                    : editingUser
                    ? 'Save Changes'
                    : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}