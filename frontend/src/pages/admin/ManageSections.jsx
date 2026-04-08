import { useEffect, useState } from 'react';
import client from '../../api/client.js';

const EMPTY_FORM = {
  course_id: '',
  section_number: '',
  instructor: '',
  schedule: '',
  location: '',
  capacity: '',
};

export default function ManageSections() {
  const [sections, setSections] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ message: '', type: '' });
  const [showModal, setShowModal] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [filterCourse, setFilterCourse] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch both sections and courses in parallel
      const [sectionsRes, coursesRes] = await Promise.all([
        client.get('/api/sections'),
        client.get('/api/courses'),
      ]);
      setSections(sectionsRes.data);
      setCourses(coursesRes.data);
    } catch (err) {
      setError('Failed to load sections.');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 3500);
  };

  const openCreateModal = () => {
    setEditingSection(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEditModal = (section) => {
    setEditingSection(section);
    setForm({
      course_id: section.course_id,
      section_number: section.section_number,
      instructor: section.instructor,
      schedule: section.schedule,
      location: section.location,
      capacity: section.capacity,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingSection(null);
    setForm(EMPTY_FORM);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingSection) {
        await client.put(`/api/sections/${editingSection.id}`, form);
        setSections(prev =>
          prev.map(s => s.id === editingSection.id ? { ...s, ...form } : s)
        );
        showToast('Section updated successfully.');
      } else {
        const { data } = await client.post('/api/sections', form);
        setSections(prev => [...prev, data]);
        showToast('Section created successfully.');
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

  const handleDelete = async (sectionId) => {
    if (!window.confirm('Delete this section? Enrolled students will be affected.')) return;
    try {
      await client.delete(`/api/sections/${sectionId}`);
      setSections(prev => prev.filter(s => s.id !== sectionId));
      showToast('Section deleted.');
    } catch (err) {
      showToast(
        err.response?.data?.message || 'Failed to delete section.',
        'error'
      );
    }
  };

  // Helper to get course name by id
  const getCourseName = (courseId) => {
    const course = courses.find(c => c.id === Number(courseId));
    return course ? `${course.code} — ${course.name}` : 'Unknown Course';
  };

  const filtered = filterCourse
    ? sections.filter(s => String(s.course_id) === filterCourse)
    : sections;

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
        <h2 className="text-xl font-bold text-gray-800">Manage Sections</h2>
        <button onClick={openCreateModal} className="btn-primary">
          + Create Section
        </button>
      </div>

      {/* Filter by Course */}
      <select
        value={filterCourse}
        onChange={(e) => setFilterCourse(e.target.value)}
        className="input mb-6 max-w-sm"
      >
        <option value="">All Courses</option>
        {courses.map(course => (
          <option key={course.id} value={String(course.id)}>
            {course.code} — {course.name}
          </option>
        ))}
      </select>

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

      {/* Sections Table */}
      {!loading && filtered.length > 0 && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-5 py-3 text-left">Course</th>
                <th className="px-5 py-3 text-left">Section</th>
                <th className="px-5 py-3 text-left">Instructor</th>
                <th className="px-5 py-3 text-left">Schedule</th>
                <th className="px-5 py-3 text-left">Location</th>
                <th className="px-5 py-3 text-left">Capacity</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(section => (
                <tr key={section.id} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-3 text-gray-700 font-medium">
                    {getCourseName(section.course_id)}
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {section.section_number}
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {section.instructor}
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {section.schedule}
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {section.location}
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {section.enrolled ?? 0}/{section.capacity}
                  </td>
                  <td className="px-5 py-3 text-right space-x-2">
                    <button
                      onClick={() => openEditModal(section)}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(section.id)}
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
          <p className="font-medium">No sections found.</p>
          <p className="text-sm mt-1">
            {filterCourse
              ? 'No sections exist for this course yet.'
              : 'Create the first section to get started.'}
          </p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 z-50">

            <h3 className="text-lg font-bold text-gray-800 mb-5">
              {editingSection ? 'Edit Section' : 'Create New Section'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course
                </label>
                <select
                  name="course_id"
                  value={form.course_id}
                  onChange={handleChange}
                  required
                  className="input"
                >
                  <option value="">Select a course...</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.code} — {course.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Section Number
                </label>
                <input
                  type="text"
                  name="section_number"
                  value={form.section_number}
                  onChange={handleChange}
                  required
                  className="input"
                  placeholder="e.g. 01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Instructor
                </label>
                <input
                  type="text"
                  name="instructor"
                  value={form.instructor}
                  onChange={handleChange}
                  required
                  className="input"
                  placeholder="e.g. Dr. Smith"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Schedule
                </label>
                <input
                  type="text"
                  name="schedule"
                  value={form.schedule}
                  onChange={handleChange}
                  required
                  className="input"
                  placeholder="e.g. MWF 10:00–11:00 AM"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  required
                  className="input"
                  placeholder="e.g. Room 204"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacity
                </label>
                <input
                  type="number"
                  name="capacity"
                  value={form.capacity}
                  onChange={handleChange}
                  required
                  className="input"
                  placeholder="e.g. 30"
                  min="1"
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
                    : editingSection ? 'Save Changes' : 'Create Section'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}