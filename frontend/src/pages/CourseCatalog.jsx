import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getCatalogData } from '../api/catalog.js';
import { createEnrollment } from '../api/enrollment.js';

export default function CourseCatalog() {
  const { user, logout } = useAuth();

  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ message: '', type: '' });
  const [submittingSectionId, setSubmittingSectionId] = useState(null);

  useEffect(() => {
    fetchCatalog();
  }, []);

  const fetchCatalog = async () => {
    try {
      setLoading(true);
      setError('');

      const data = await getCatalogData({
        coursePage: 1,
        courseLimit: 100,
        sectionPage: 1,
      });

      setCourses(data.courses || []);
    } catch (err) {
      //console.error('CATALOG LOAD ERROR:', err.response?.data || err);--used during dev
      setError(err.response?.data?.error || 'Failed to load course catalog.');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 3500);
  };

  const handleEnroll = async (sectionId) => {
    try {
      setSubmittingSectionId(sectionId);

      await createEnrollment({
        secId: Number(sectionId),
        stuId: Number(user?.role_id),
      });

      showToast('Successfully enrolled!', 'success');
      await fetchCatalog(); //refresh enrollablel sections
    } catch (err) {
      //console.error('ENROLL ERROR:', err.response?.data || err);--used during dev
      showToast(
        err.response?.data?.error || 'Enrollment failed. Please try again.',
        'error'
      );
    } finally {
      setSubmittingSectionId(null);
    }
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return courses;

    return courses.filter((course) => {
      const code = String(course.course_code || '').toLowerCase();
      const title = String(course.title || '').toLowerCase();
      const subject = String(course.subject || '').toLowerCase();

      return code.includes(q) || title.includes(q) || subject.includes(q);
    });
  }, [courses, search]);

  const formatMeeting = (section) => {
    if (!section.days && !section.start_time && !section.end_time) {
      return 'Async';
    }

    return `${section.days || ''} ${section.start_time || ''} - ${section.end_time || ''}`.trim();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {toast.message && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-500'
          }`}
        >
          {toast.message}
        </div>
      )}

      <nav className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">Course Registration</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">Welcome, {user?.name}</span>
          <Link to="/student" className="text-sm text-blue-600 hover:underline">
            My Schedule
          </Link>
          <button
            onClick={handleLogout}
            className="text-sm text-red-500 hover:text-red-700 transition"
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Course Catalog</h2>
        <p className="text-gray-500 text-sm mb-6">
          Browse available courses and enroll in a section.
        </p>

        <input
          type="text"
          placeholder="Search by course code, title, or subject..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input mb-6"
        />

        {error && (
          <div className="bg-red-50 border border-red-300 text-red-600 text-sm rounded-lg px-4 py-3 mb-5">
            {error}
          </div>
        )}

        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow p-5 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-3"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && !error && (
          <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
            <p className="text-lg font-medium">No courses found.</p>
            <p className="text-sm mt-1">Try a different search term.</p>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="space-y-6">
            {filtered.map((course) => (
              <div key={course.course_id} className="bg-white rounded-xl shadow p-5">
                <div className="mb-3">
                  <h3 className="text-lg font-bold text-gray-800">
                    {course.course_code} — {course.title}
                  </h3>
                  {course.description && (
                    <p className="text-sm text-gray-500 mt-1">{course.description}</p>
                  )}
                  <div className="flex gap-4 mt-1 text-xs text-gray-400">
                    <span>{course.credits} credit(s)</span>
                    {course.subject && <span>{course.subject}</span>}
                  </div>
                </div>

                <div className="space-y-2">
                  {course.sections && course.sections.length > 0 ? (
                    course.sections.map((section) => (
                      <div
                        key={section.section_id}
                        className="flex justify-between items-center bg-gray-50 rounded-lg px-4 py-3"
                      >
                        <div className="text-sm text-gray-700">
                          <span className="font-medium">Section {section.section_id}</span>
                          <span>&nbsp;|&nbsp;{formatMeeting(section)}</span>
                          <span>&nbsp;|&nbsp;Capacity: {section.capacity}</span>
                        </div>

                        <button
                          onClick={() => handleEnroll(section.section_id)}
                          disabled={submittingSectionId === section.section_id}
                          className="btn-primary text-sm py-1 px-4 ml-4 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {submittingSectionId === section.section_id ? 'Enrolling...' : 'Enroll'}
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400 italic">
                      No sections available for this course.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}