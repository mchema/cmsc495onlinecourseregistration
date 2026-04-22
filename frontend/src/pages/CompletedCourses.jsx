import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { listEnrollments } from '../api/enrollment.js';

function formatSemester(row) {
  if (row.semester_term && row.semester_year) {
    return `${row.semester_term} ${row.semester_year}`;
  }
  return row.semester_id ? `Semester ${row.semester_id}` : 'N/A';
}

export default function CompletedCourses() {
  const { user, logout } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCompletedCourses = async () => {
      try {
        setLoading(true);
        setError('');

        const data = await listEnrollments({ status: 'completed' });
        setCourses(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(
          err.response?.data?.error || 'Failed to load completed courses.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCompletedCourses();
  }, []);

  const totalCompleted = useMemo(() => courses.length, [courses]);

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">Course Registration</h1>

        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">Welcome, {user?.name}</span>

          <Link to="/catalog" className="btn-primary text-sm py-1 px-4">
            Browse Courses
          </Link>

          <Link
            to="/student"
            className="text-sm text-blue-600 hover:text-blue-700 transition"
          >
            My Schedule
          </Link>

          <Link
            to="/completed"
            className="text-sm text-blue-600 hover:text-blue-700 transition"
          >
            Completed Courses
          </Link>

          <button
            onClick={handleLogout}
            className="text-sm text-red-500 hover:text-red-700 transition"
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-4xl font-semibold text-gray-800">
            Completed Courses
          </h1>
          <p className="text-gray-500 mt-2">
            View courses that have been marked as completed.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow p-5 mb-6">
          <p className="text-sm text-gray-500">Total completed courses</p>
          <p className="text-2xl font-semibold text-gray-800 mt-1">
            {totalCompleted}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-600">
            {error}
          </div>
        )}

        {loading && (
          <div className="bg-white rounded-xl shadow p-6 text-center text-gray-500">
            Loading completed courses...
          </div>
        )}

        {!loading && !error && courses.length === 0 && (
          <div className="bg-white rounded-xl shadow p-6 text-center text-gray-500">
            No completed courses found yet.
          </div>
        )}

        {!loading && !error && courses.length > 0 && (
          <div className="space-y-4">
            {courses.map((course) => (
              <div
                key={course.enrollment_id}
                className="bg-white rounded-xl shadow p-5"
              >
                <h2 className="text-xl font-semibold text-gray-800">
                  {course.course_code} — {course.course_title}
                </h2>

                <p className="text-sm text-gray-500 mt-2">
                  Section {course.section_id}
                  &nbsp;|&nbsp;{course.professor_name || 'Professor TBA'}
                </p>

                <p className="text-sm text-gray-500 mt-1">
                  {formatSemester(course)}
                  &nbsp;|&nbsp;Status: {course.status}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}