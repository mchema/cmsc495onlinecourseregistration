import { useEffect, useMemo, useState } from 'react';
import { listEnrollments, updateEnrollment } from '../../api/enrollment.js';
import { getUsers } from '../../api/admin.js';

function Toast({ toast, onClose }) {
  if (!toast?.message) return null;

  const isError = toast.type === 'error';
  return (
    <div
      className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white ${
        isError ? 'bg-red-500' : 'bg-green-500'
      }`}
    >
      <div className="flex items-center gap-3">
        <span>{toast.message}</span>
        <button onClick={onClose} className="text-white/90 hover:text-white">
          ×
        </button>
      </div>
    </div>
  );
}

function formatSemester(row) {
  if (row.semester_term && row.semester_year) {
    return `${row.semester_term} ${row.semester_year}`;
  }
  return row.semester_id ? `Semester ${row.semester_id}` : 'N/A';
}

function formatMeeting(row) {
  const days = row.days || 'TBA';
  const start = row.start_time || 'TBA';
  const end = row.end_time || 'TBA';
  return `${days} ${start} - ${end}`;
}

export default function ManageEnrollments() {
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [enrollments, setEnrollments] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ message: '', type: '' });
  const [workingId, setWorkingId] = useState(null);

  useEffect(() => {
    const loadStudents = async () => {
      try {
        setLoadingStudents(true);
        setError('');

        const result = await getUsers({ page: 1, limit: 100, role: 'STUDENT', _ts: Date.now() });
        const rows = result?.User || [];
        const normalized = rows
          .map((entry) => entry?.User || entry)
          .filter(Boolean)
          .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));

        setStudents(normalized);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load students.');
      } finally {
        setLoadingStudents(false);
      }
    };

    loadStudents();
  }, []);

  useEffect(() => {
    const loadEnrollments = async () => {
      if (!selectedStudentId) {
        setEnrollments([]);
        return;
      }

      try {
        setLoadingEnrollments(true);
        setError('');

        const rows = await listEnrollments({ stuId: selectedStudentId });
        setEnrollments(Array.isArray(rows) ? rows : []);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load enrollments.');
      } finally {
        setLoadingEnrollments(false);
      }
    };

    loadEnrollments();
  }, [selectedStudentId]);

  const selectedStudent = useMemo(
    () => students.find((s) => String(s.role_id) === String(selectedStudentId)),
    [students, selectedStudentId]
  );

  const handleMarkComplete = async (enrollmentId) => {
    try {
      setWorkingId(enrollmentId);
      setError('');

      await updateEnrollment(enrollmentId, { status: 'completed' });

      setToast({ message: 'Enrollment marked as completed.', type: 'success' });

      const rows = await listEnrollments({ stuId: selectedStudentId });
      setEnrollments(Array.isArray(rows) ? rows : []);
    } catch (err) {
      setToast({
        message: err.response?.data?.error || 'Failed to mark enrollment complete.',
        type: 'error',
      });
    } finally {
      setWorkingId(null);
    }
  };

  return (
    <div className="mt-8">
      <Toast toast={toast} onClose={() => setToast({ message: '', type: '' })} />

      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-3xl font-semibold text-gray-800">Manage Enrollments</h2>
          <p className="text-sm text-gray-500 mt-1">
            Select a student and mark active enrollments as completed.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-5 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Student
        </label>
        <select
          value={selectedStudentId}
          onChange={(e) => setSelectedStudentId(e.target.value)}
          disabled={loadingStudents}
          className="w-full rounded-lg border px-3 py-2"
        >
          <option value="">
            {loadingStudents ? 'Loading students...' : 'Select a student'}
          </option>
          {students.map((student) => (
            <option key={student.id} value={student.role_id}>
              {student.name} ({student.email})
            </option>
          ))}
        </select>

        {selectedStudent && (
          <p className="text-sm text-gray-500 mt-3">
            Viewing enrollments for <span className="font-medium">{selectedStudent.name}</span>
          </p>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-600">
          {error}
        </div>
      )}

      {!selectedStudentId && (
        <div className="bg-white rounded-xl shadow p-6 text-center text-gray-500">
          Select a student to view current enrollments.
        </div>
      )}

      {selectedStudentId && loadingEnrollments && (
        <div className="bg-white rounded-xl shadow p-6 text-center text-gray-500">
          Loading enrollments...
        </div>
      )}

      {selectedStudentId && !loadingEnrollments && enrollments.length === 0 && (
        <div className="bg-white rounded-xl shadow p-6 text-center text-gray-500">
          No enrollments found for this student.
        </div>
      )}

      {selectedStudentId && !loadingEnrollments && enrollments.length > 0 && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-5 py-3">Course</th>
                <th className="text-left px-5 py-3">Section</th>
                <th className="text-left px-5 py-3">Semester</th>
                <th className="text-left px-5 py-3">Professor</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-left px-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map((row) => {
                const canComplete = String(row.status).toLowerCase() === 'enrolled';

                return (
                  <tr key={row.enrollment_id} className="border-t">
                    <td className="px-5 py-4">
                      <div className="font-medium text-gray-800">
                        {row.course_code} — {row.course_title}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatMeeting(row)}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {row.section_id}
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {formatSemester(row)}
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {row.professor_name || 'Professor TBA'}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-full px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700">
                        {row.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => handleMarkComplete(row.enrollment_id)}
                        disabled={!canComplete || workingId === row.enrollment_id}
                        className="px-3 py-2 rounded-lg border text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {workingId === row.enrollment_id
                          ? 'Updating...'
                          : canComplete
                          ? 'Mark Complete'
                          : 'No Action'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}