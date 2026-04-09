import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
//import { logout as logoutApi } from '../api/auth.js';
import client from '../api/client.js';

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const fetchEnrollments = async () => {
    try {
      const { data } = await client.get(`/api/enrollments/student/${user.id}`);
      setEnrollments(data);
    } catch (err) {
      setError('Failed to load your schedule. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = async (enrollmentId) => {
    if (!window.confirm('Are you sure you want to drop this course?')) return;
    try {
      await client.delete(`/api/enrollments/${enrollmentId}`);
      setEnrollments(prev => prev.filter(e => e.id !== enrollmentId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to drop course.');
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Navbar */}
      <nav className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">Course Registration</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">Welcome, {user?.name}</span>
          <Link
            to="/catalog"
            className="btn-primary text-sm py-1 px-4"
          >
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

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">My Schedule</h2>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-300 text-red-600 text-sm rounded-lg px-4 py-3 mb-5">
            {error}
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl shadow p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && enrollments.length === 0 && !error && (
          <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
            <p className="text-lg font-medium mb-2">No courses enrolled yet.</p>
            <p className="text-sm mb-4">Browse the catalog to register for classes.</p>
            <Link to="/catalog" className="btn-primary inline-block">
              Browse Courses
            </Link>
          </div>
        )}

        {/* Enrollment Cards */}
        {!loading && enrollments.length > 0 && (
          <div className="space-y-4">
            {enrollments.map(enrollment => (
              <div
                key={enrollment.id}
                className="bg-white rounded-xl shadow p-5 flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold text-gray-800">
                    {enrollment.course_code} — {enrollment.course_name}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Section {enrollment.section_number} &nbsp;|&nbsp;
                    {enrollment.instructor} &nbsp;|&nbsp;
                    {enrollment.schedule} &nbsp;|&nbsp;
                    {enrollment.location}
                  </p>
                </div>
                <button
                  className="btn-danger"
                  onClick={() => handleDrop(enrollment.id)}
                >
                  Drop
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}