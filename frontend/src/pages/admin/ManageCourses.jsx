import { useEffect, useState } from 'react';
import client from '../../api/client.js';

const EMPTY_FORM = {
  code: '',
  name: '',
  description: '',
  credits: '',
};

export default function ManageCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ message: '', type: '' });
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data } = await client.get('/api/courses');
      setCourses(data);
    } catch (err) {
      setError('Failed to load courses.');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 3500);
  };

  const openCreateModal = () => {
    setEditingCourse(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEditModal = (course) => {
    setEditingCourse(course);
    setForm({
      code: course.code,
      name: course.name,
      description: course.description || '',
      credits: course.credits || '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCourse(null);
    setForm(EMPTY_FORM);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingCourse) {
        await client.put(`/api/courses/${editingCourse.id}`, form);
        setCourses(prev =>
          prev.map(c => c.id === editingCourse.id ? { ...c, ...form } : c)
        );
        showToast('Course updated successfully.');
      } else {
        const { data } = await client.post('/api/courses', form);
        setCourses(prev => [...prev, data]);
        showToast('Course created successfully.');
      }
      closeModal();
    } catch (err) {
      showToast(
        err.response?.data?.message || 'Action failed. Please try again.',
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (courseId) => {
    if (!window.confirm('Delete this course? This may also remove associated sections.')) return;
    try {
      await client.delete(`/api/courses/${courseId}`);
      setCourses(prev => prev.filter(c => c.id !== courseId));
      showToast('Course deleted.');
    } catch (err) {
      showToast(
        err.response?.data?.message || 'Failed to delete course.',
        'error'
      );
    }
  };

  const filtered = courses.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>

      {/* Toast */}
      {toast.message && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm
            ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-500'}`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Manage Courses</h2>
        <button onClick={openCreateModal} className="btn-primary">
          + Create Course
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by name or code..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="input mb-6"
      />

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-300 text-red-600 text-sm rounded-lg px-4 py-3 mb-5">
          {error}
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl shadow p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      )}

      {/* Courses Table */}
      {!loading && filtered.length > 0 && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-5 py-3 text-left">Code</th>
                <th className="px-5 py-3 text-left">Name</th>
                <th className="px-5 py-3 text-left">Credits</th>
                <th className="px-5 py-3 text-left">Description</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(course => (
                <tr key={course.id} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-3 font-mono text-blue-700 font-medium">
                    {course.code}
                  </td>
                  <td className="px-5 py-3 font-medium text-gray-800">
                    {course.name}
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {course.credits ?? '—'}
                  </td>
                  <td className="px-5 py-3 text-gray-400 max-w-xs truncate">
                    {course.description || '—'}
                  </td>
                  <td className="px-5 py-3 text-right space-x-2">
                    <button
                      onClick={() => openEditModal(course)}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(course.id)}
                      className="text-red-500 hover:underline text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {!loading && filtered.length === 0 && !error && (
        <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
          <p className="font-medium">No courses found.</p>
          <p className="text-sm mt-1">
            {search ? 'Try a different search term.' : 'Create the first course to get started.'}
          </p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 z-50">

            <h3 className="text-lg font-bold text-gray-800 mb-5">
              {editingCourse ? 'Edit Course' : 'Create New Course'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course Code
                </label>
                <input
                  type="text"
                  name="code"
                  value={form.code}
                  onChange={handleChange}
                  required
                  className="input"
                  placeholder="e.g. CMSC495"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="input"
                  placeholder="e.g. Capstone in Computer Science"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Credits
                </label>
                <input
                  type="number"
                  name="credits"
                  value={form.credits}
                  onChange={handleChange}
                  className="input"
                  placeholder="e.g. 3"
                  min="1"
                  max="6"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  className="input resize-none"
                  rows={3}
                  placeholder="Brief course description..."
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
                    : editingCourse ? 'Save Changes' : 'Create Course'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}