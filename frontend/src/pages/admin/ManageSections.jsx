import { useEffect, useMemo, useState } from 'react';
import {
  getSections,
  createSection,
  updateSection,
  deleteSection,
} from '../../api/sections.js';
import { getCourses } from '../../api/courses.js';
import { getSemesters } from '../../api/semesters.js';
import { getProfessors } from '../../api/professors.js';

const EMPTY_FORM = {
  cId: '',
  semId: '',
  profId: '',
  capacity: 30,
  days: '',
  startTm: '',
  endTm: '',
};

export default function ManageSections() {
  const [sections, setSections] = useState([]);
  const [courses, setCourses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [professors, setProfessors] = useState([]);

  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ message: '', type: '' });

  const [showModal, setShowModal] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [filterCourse, setFilterCourse] = useState('');
  const [filterSemester, setFilterSemester] = useState('');

  useEffect(() => {
    fetchLookupData();
  }, []);

  useEffect(() => {
    fetchSections(page);
  }, [page, filterCourse, filterSemester]);

  const fetchLookupData = async () => {
    try {
      const [courseData, semesterData, professorData] = await Promise.all([
        getCourses({ page: 1, limit: 50 }),
        getSemesters(),
        getProfessors(),
      ]);

      setCourses((courseData?.Course || []).map((entry) => entry?.Course || entry));
      
      const rawSemesters = Array.isArray(semesterData?.Semester)
        ? semesterData.Semester
        : Array.isArray(semesterData)
        ? semesterData
        : [];

      setSemesters(rawSemesters.map((entry) => entry?.Semester || entry));

      setProfessors((professorData?.User || []).map((entry) => entry?.User || entry));
    } catch (err) {
      console.error('LOOKUP LOAD ERROR:', err.response?.data || err);
      setError('Failed to load lookup data.');
    }
  };

  const fetchSections = async (nextPage = 1) => {
    try {
      setLoading(true);
      setError('');
      
      //v.2 stops query params from being sent
      const params = { page: nextPage, limit };

      const courseId = Number(filterCourse);
      const semesterId = Number(filterSemester);

      if (Number.isFinite(courseId) && courseId > 0) {
        params.crsId = courseId;
      }

      if (Number.isFinite(semesterId) && semesterId > 0) {
        params.semId = semesterId;
      }

      const data = await getSections(params);

      setSections(data?.Section || []);
      setMeta(data?.Meta || null);
    } catch (err) {
      console.error('SECTION LOAD ERROR:', err.response?.data || err);
      setError(err.response?.data?.error || 'Failed to load sections.');
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
    const s = section?.Section || section;
    setEditingSection(s);
    setForm({
      cId: String(s.course_id ?? ''),
      semId: String(s.semester_id ?? ''),
      profId: String(s.professor_id ?? ''),
      capacity: s.capacity ?? 30,
      days: s.days ?? '',
      startTm: s.start_time ?? '',
      endTm: s.end_time ?? '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingSection(null);
    setForm(EMPTY_FORM);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'capacity' ? Number(value) : value,
    }));
  };

  const buildPayload = () => {
    const payload = {
      semId: Number(form.semId),
      profId: Number(form.profId),
      capacity: Number(form.capacity),
    };

    const hasAnyTimeField = form.days || form.startTm || form.endTm;
    if (hasAnyTimeField) {
      payload.days = form.days;
      payload.startTm = form.startTm;
      payload.endTm = form.endTm;
    }

    return payload;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = buildPayload();
      console.log('SECTION PAYLOAD:', payload);
      console.log('SECTION FORM:', form);

      if (editingSection) {
        await updateSection(editingSection.section_id, payload);
        showToast('Section updated successfully.');
      } else {
        await createSection(Number(form.cId), payload);
        showToast('Section created successfully.');
      }

      closeModal();
      await fetchSections(page);
    } catch (err) {
      console.error('SECTION SUBMIT ERROR:', err.response?.data || err);
      showToast(
        err.response?.data?.error || 'Action failed. Please try again.',
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (sectionId) => {
    if (!window.confirm('Delete this section?')) return;

    try {
      await deleteSection(sectionId);
      showToast('Section deleted.');
      await fetchSections(page);
    } catch (err) {
      console.error('DELETE SECTION ERROR:', err.response?.data || err);
      showToast(
        err.response?.data?.error || 'Failed to delete section.',
        'error'
      );
    }
  };

  const normalizedCourses = useMemo(() => courses, [courses]);

  const normalizedProfessors = useMemo(() => professors, [professors]);

  const getCourseLabel = (courseId) => {
    const course = normalizedCourses.find((c) => Number(c.course_id) === Number(courseId));
    return course ? `${course.course_code} — ${course.title}` : `Course #${courseId}`;
  };

  const getSemesterLabel = (semesterId) => {
    const semester = semesters.find((s) => Number(s.semester_id) === Number(semesterId));
    return semester ? `${semester.term} ${semester.year}` : `Semester #${semesterId}`;
  };

  const getProfessorLabel = (profId) => {
    const prof = normalizedProfessors.find((p) => Number(p.role_id) === Number(profId));
    return prof ? prof.name : `Professor #${profId}`;
  };

  const formatMeeting = (section) => {
    if (!section.days && !section.start_time && !section.end_time) return 'Async';
    return `${section.days || ''} ${section.start_time || ''} - ${section.end_time || ''}`.trim();
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

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Manage Sections</h2>
        <button onClick={openCreateModal} className="btn-primary">
          + Create Section
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <select
          value={filterCourse}
          onChange={(e) => {
            setPage(1);
            setFilterCourse(e.target.value);
          }}
          className="input"
        >
          <option value="">All Courses</option>
          {normalizedCourses.map((course) => (
            <option key={`course-${course.course_id}`} value={String(course.course_id)}>
              {course.course_code} — {course.title}
            </option>
          ))}
        </select>

        <select
          value={filterSemester}
          onChange={(e) => {
            setPage(1);
            setFilterSemester(e.target.value);
          }}
          className="input"
        >
          <option value="">All Semesters</option>
          {semesters.map((semester) => (
            <option key={semester.semester_id} value={String(semester.semester_id)}>
              {semester.term} {semester.year}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-600 text-sm rounded-lg px-4 py-3 mb-5">
          {error}
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      )}

      {!loading && sections.length > 0 && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-5 py-3 text-left">Course</th>
                <th className="px-5 py-3 text-left">Semester</th>
                <th className="px-5 py-3 text-left">Professor</th>
                <th className="px-5 py-3 text-left">Meeting</th>
                <th className="px-5 py-3 text-left">Capacity</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sections.map((entry, index) => {
                const section = entry?.Section || entry;
                return (
                  <tr key={section?.section_id ?? index} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-3 text-gray-700 font-medium">
                      {getCourseLabel(section.course_id)}
                    </td>
                    <td className="px-5 py-3 text-gray-500">
                      {getSemesterLabel(section.semester_id)}
                    </td>
                    <td className="px-5 py-3 text-gray-500">
                      {getProfessorLabel(section.professor_id)}
                    </td>
                    <td className="px-5 py-3 text-gray-500">
                      {formatMeeting(section)}
                    </td>
                    <td className="px-5 py-3 text-gray-500">{section.capacity}</td>
                    <td className="px-5 py-3 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(section)}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(section.section_id)}
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

      {!loading && sections.length === 0 && !error && (
        <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
          <p className="font-medium">No sections found.</p>
          <p className="text-sm mt-1">Create the first section to get started.</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 z-50">
            <h3 className="text-lg font-bold text-gray-800 mb-5">
              {editingSection ? 'Edit Section' : 'Create New Section'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingSection && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Course
                  </label>
                  <select
                    name="cId"
                    value={form.cId}
                    onChange={handleChange}
                    required
                    className="input"
                  >
                    <option value="">Select a course...</option>
                    {normalizedCourses.map((course) => (
                      <option key={`course-${course.course_id}`} value={String(course.course_id)}>
                        {course.course_code} — {course.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Semester
                </label>
                <select
                  name="semId"
                  value={form.semId}
                  onChange={handleChange}
                  required
                  className="input"
                >
                  <option value="">Select a semester...</option>
                  {semesters.map((semester) => (
                    <option key={semester.semester_id} value={String(semester.semester_id)}>
                      {semester.term} {semester.year}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Professor
                </label>
                <select
                  name="profId"
                  value={form.profId}
                  onChange={handleChange}
                  required
                  className="input"
                >
                  <option value="">Select a professor...</option>
                  {normalizedProfessors.map((prof) => (
                    <option key={prof.role_id} value={String(prof.role_id)}>
                      {prof.name}
                    </option>
                  ))}
                </select>
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
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Days
                </label>
                <input
                  type="text"
                  name="days"
                  value={form.days}
                  onChange={handleChange}
                  className="input"
                  placeholder="MW, TR, MWF, async"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="text"
                    name="startTm"
                    value={form.startTm}
                    onChange={handleChange}
                    className="input"
                    placeholder="09:00:00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="text"
                    name="endTm"
                    value={form.endTm}
                    onChange={handleChange}
                    className="input"
                    placeholder="10:15:00"
                  />
                </div>
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
                    : editingSection
                    ? 'Save Changes'
                    : 'Create Section'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}