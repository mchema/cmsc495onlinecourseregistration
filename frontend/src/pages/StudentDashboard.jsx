import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { listEnrollments, updateEnrollment } from '../api/enrollment.js';

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ message: '', type: '' });
  const [droppingId, setDroppingId] = useState(null);

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await listEnrollments();
      setEnrollments(Array.isArray(data) ? data : []);
    } catch (err) {
      //console.error('ENROLLMENT LOAD ERROR:', err.response?.data || err); --used during dev
      setError(err.response?.data?.error || 'Failed to load your schedule. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 3500);
  };

  const handleDrop = async (enrollmentId) => {
    if (!window.confirm('Are you sure you want to drop this course?')) return;

    try {
      setDroppingId(enrollmentId);
      await updateEnrollment(enrollmentId, { status: 'dropped' });
      setError('');
      showToast('Course dropped successfully.', 'success');
      await fetchEnrollments();
    } catch (err) {
      //console.error('DROP ERROR:', err.response?.data || err);-- used during dev
      setError(err.response?.data?.error || 'Failed to drop course.');
    } finally {
      setDroppingId(null);
    }
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  const formatMeeting = (enrollment) => {
    if (!enrollment.days && !enrollment.start_time && !enrollment.end_time) {
      return 'Async';
    }

    return `${enrollment.days || ''} ${enrollment.start_time || ''} - ${enrollment.end_time || ''}`.trim();
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
          <Link to="/catalog" className="btn-primary text-sm py-1 px-4">
            Browse Courses
          </Link>
          <button
            onClick={handleLogout}
            className="text-sm text-red-500 hover:text-red-700 transition"
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">My Schedule</h2>

        {error && (
          <div className="bg-red-50 border border-red-300 text-red-600 text-sm rounded-lg px-4 py-3 mb-5">
            {error}
          </div>
        )}

        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        )}

        {!loading && enrollments.length === 0 && !error && (
          <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
            <p className="text-lg font-medium mb-2">No courses enrolled yet.</p>
            <p className="text-sm mb-4">Browse the catalog to register for classes.</p>
            <Link to="/catalog" className="btn-primary inline-block">
              Browse Courses
            </Link>
          </div>
        )}

        {!loading && enrollments.length > 0 && (
          <div className="space-y-4">
            {enrollments.map((enrollment) => (
              <div
                key={enrollment.enrollment_id}
                className="bg-white rounded-xl shadow p-5 flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold text-gray-800">
                    {enrollment.course_code} — {enrollment.course_title}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Section {enrollment.section_id}
                    &nbsp;|&nbsp;{enrollment.professor_name || 'Professor TBA'}
                    &nbsp;|&nbsp;{formatMeeting(enrollment)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {enrollment.semester_term && enrollment.semester_year
                      ? `${enrollment.semester_term} ${enrollment.semester_year}`
                      : `Semester ${enrollment.semester_id}`}
                  </p>
                </div>

                {['enrolled', 'waitlisted'].includes(enrollment.status) && (
                  <button
                    className="btn-danger disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => handleDrop(enrollment.enrollment_id)}
                    disabled={droppingId === enrollment.enrollment_id}
                  >
                    {droppingId === enrollment.enrollment_id ? 'Dropping...' : 'Drop'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}