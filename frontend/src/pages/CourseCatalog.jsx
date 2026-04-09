import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import client from '../api/client.js';

export default function CourseCatalog() {
  const { user, logout } = useAuth();
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ message: '', type: '' });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data } = await client.get('/api/courses');
      setCourses(data);
    } catch (err) {
      setError('Failed to load courses. Please try again.');
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
      await client.post('/api/enrollments', { section_id: sectionId });
      showToast('Successfully enrolled!', 'success');
    } catch (err) {
      // Backend handles conflict, capacity, and prereq errors — display them directly
      showToast(
        err.response?.data?.message || 'Enrollment failed. Please try again.',
        'error'
      );
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const filtered = courses.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Toast Notification */}
      {toast.message && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm transition-all
            ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-500'}`}
        >
          {toast.message}
        </div>
      )}

      {/* Navbar */}
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

      {/* Main Content */}
      <main className="max-w-5xl mx-auto p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Course Catalog</h2>
        <p className="text-gray-500 text-sm mb-6">
          Browse available courses and enroll in a section.
        </p>

        {/* Search Bar */}
        <input
          type="text"
          placeholder="Search by course name or code..."
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

        {/* Empty State */}
        {!loading && filtered.length === 0 && !error && (
          <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
            <p className="text-lg font-medium">No courses found.</p>
            <p className="text-sm mt-1">Try a different search term.</p>
          </div>
        )}

        {/* Course Cards */}
        {!loading && filtered.length > 0 && (
          <div className="space-y-6">
            {filtered.map((course) => (
              <div key={course.id} className="bg-white rounded-xl shadow p-5">

                {/* Course Header */}
                <div className="mb-3">
                  <h3 className="text-lg font-bold text-gray-800">
                    {course.code} — {course.name}
                  </h3>
                  {course.description && (
                    <p className="text-sm text-gray-500 mt-1">{course.description}</p>
                  )}
                  {course.credits && (
                    <p className="text-xs text-gray-400 mt-1">{course.credits} credit(s)</p>
                  )}
                </div>

                {/* Sections */}
                <div className="space-y-2">
                  {course.sections && course.sections.length > 0 ? (
                    course.sections.map((section) => {
                      const isFull = section.enrolled >= section.capacity;
                      return (
                        <div
                          key={section.id}
                          className="flex justify-between items-center bg-gray-50 rounded-lg px-4 py-3"
                        >
                          <div className="text-sm text-gray-700">
                            <span className="font-medium">
                              Section {section.section_number}
                            </span>
                            &nbsp;|&nbsp;{section.instructor}
                            &nbsp;|&nbsp;{section.schedule}
                            &nbsp;|&nbsp;{section.location}
                            &nbsp;|&nbsp;
                            <span className={isFull ? 'text-red-500' : 'text-green-600'}>
                              {section.enrolled}/{section.capacity} seats
                            </span>
                          </div>
                          <button
                            onClick={() => handleEnroll(section.id)}
                            disabled={isFull}
                            className="btn-primary text-sm py-1 px-4 ml-4 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isFull ? 'Full' : 'Enroll'}
                          </button>
                        </div>
                      );
                    })
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