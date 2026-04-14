import { useEffect, useState } from 'react';
import {
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
} from '../../api/courses.js';

const EMPTY_FORM = {
  code: '',
  title: '',
  desc: '',
  cred: 3,
};

export default function ManageCourses() {
  const [courses, setCourses] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ message: '', type: '' });
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  useEffect(() => {
    fetchCourses(page);
  }, [page]);

  const fetchCourses = async (nextPage = 1) => {
    try {
      setLoading(true);
      setError('');

      const data = await getCourses({ page: nextPage, limit });

      setCourses(data?.Course || []);
      setMeta(data?.Meta || null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load courses.');
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
    const c = course?.Course || course;
    setEditingCourse(c);
    setForm({
      code: c.course_code,
      title: c.title,
      desc: c.description,
      cred: c.credits,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCourse(null);
    setForm(EMPTY_FORM);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'cred' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingCourse) {
        await updateCourse(editingCourse.course_id, form);
        showToast('Course updated successfully.');
      } else {
        await createCourse(form);
        showToast('Course created successfully.');
      }

      closeModal();
      await fetchCourses(page);
    } catch (err) {
      showToast(
        err.response?.data?.error || 'Action failed. Please try again.',
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (courseId) => {
    if (!window.confirm('Delete this course?')) return;

    try {
      await deleteCourse(courseId);
      showToast('Course deleted.');
      await fetchCourses(page);
    } catch (err) {
      console.error('DELETE COURSE ERROR:', err.response?.data || err);
      showToast(
        err.response?.data?.error || 'Failed to delete course.',
        'error'
      );
    }
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
          <h2 className="text-xl font-bold text-gray-800">Manage Courses</h2>
          {meta && (
            <p className="text-sm text-gray-500 mt-1">
              Total courses: {meta.total ?? courses.length}
            </p>
          )}
        </div>
        <button onClick={openCreateModal} className="btn-primary">
          + Create Course
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

      {!loading && courses.length > 0 && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-5 py-3 text-left">Code</th>
                <th className="px-5 py-3 text-left">Title</th>
                <th className="px-5 py-3 text-left">Credits</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {courses.map((entry, index) => {
                const course = entry?.Course || entry;
                return (
                  <tr key={course?.course_id ?? index} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-3 font-medium text-gray-800">{course?.course_code}</td>
                    <td className="px-5 py-3 text-gray-500">{course?.title}</td>
                    <td className="px-5 py-3 text-gray-500">{course?.credits}</td>
                    <td className="px-5 py-3 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(course)}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(course.course_id)}
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

      {!loading && meta && (meta.totalPages ?? 1) > 1 && (
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page === 1}
            className="px-4 py-2 text-sm rounded-lg border disabled:opacity-50"
          >
            Previous
          </button>

          <span className="text-sm text-gray-600">
            Page {meta.page ?? page} of {meta.totalPages ?? 1}
          </span>

          <button
            onClick={() =>
              setPage((prev) =>
                Math.min(prev + 1, meta.totalPages ?? prev + 1)
              )
            }
            disabled={page >= (meta.totalPages ?? 1)}
            className="px-4 py-2 text-sm rounded-lg border disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {!loading && courses.length === 0 && !error && (
        <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
          <p className="font-medium">No courses found.</p>
          <p className="text-sm mt-1">Create the first course to get started.</p>
        </div>
      )}

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
                  name="code"
                  value={form.code}
                  onChange={handleChange}
                  required
                  className="input"
                  placeholder="CMSC340"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  required
                  className="input"
                  placeholder="Web Programming"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="desc"
                  value={form.desc}
                  onChange={handleChange}
                  required
                  className="input min-h-[100px]"
                  placeholder="Course description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Credits
                </label>
                <input
                  type="number"
                  name="cred"
                  value={form.cred}
                  onChange={handleChange}
                  min="1"
                  required
                  className="input"
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
                    : editingCourse
                    ? 'Save Changes'
                    : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}