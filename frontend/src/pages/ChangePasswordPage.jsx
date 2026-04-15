import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { changePassword } from '../api/auth.js';

export default function ChangePasswordPage() {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validate = () => {
    if (!form.password || !form.confirmPassword) {
      return 'Please fill in both password fields.';
    }

    if (form.password !== form.confirmPassword) {
      return 'Passwords do not match.';
    }

    if (form.password.length < 8) {
      return 'Password must be at least 8 characters long.';
    }

    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      await changePassword(form.password);
      await refreshUser();

      setSuccess('Password updated successfully.');

      const role = String(user?.role || '').toUpperCase();

      setTimeout(() => {
        if (role === 'ADMIN') {
          navigate('/admin', { replace: true });
        } else {
          navigate('/student', { replace: true });
        }
      }, 800);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          'Failed to update password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white rounded-2xl shadow-md w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Change Password</h1>
          <p className="text-gray-500 text-sm mt-2">
            Welcome{user?.name ? `, ${user.name}` : ''}. You must set a new password before continuing.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-300 text-red-600 text-sm rounded-lg px-4 py-3 mb-5">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-300 text-green-700 text-sm rounded-lg px-4 py-3 mb-5">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              New Password
            </label>
            <input
              id="password"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              className="input"
              placeholder="Enter a new password"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              className="input"
              placeholder="Re-enter your new password"
            />
          </div>

          <div className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-3">
            Your new password should include an uppercase letter, lowercase letter,
            number, and special character.
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Updating Password...' : 'Update Password'}
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full text-sm text-gray-500 hover:text-gray-700 transition"
          >
            Cancel and Log Out
          </button>
        </form>
      </div>
    </div>
  );
}