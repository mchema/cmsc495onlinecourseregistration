import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import ManageUsers from './ManageUsers.jsx';
import ManageCourses from './ManageCourses.jsx';
import ManageSections from './ManageSections.jsx';

const TABS = ['Users', 'Courses', 'Sections'];

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('Users');

  //need to re-visit -mark
  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Navbar */}
      <nav className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">Admin Panel</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            {user?.name}
            <span className="ml-2 bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">
              Admin
            </span>
          </span>
          <button
            onClick={handleLogout}
            className="text-sm text-red-500 hover:text-red-700 transition"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Tab Bar */}
      <div className="bg-white border-b px-6">
        <div className="flex gap-6">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 text-sm font-medium border-b-2 transition ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <main className="max-w-6xl mx-auto p-6">
        {activeTab === 'Users' && <ManageUsers />}
        {activeTab === 'Courses' && <ManageCourses />}
        {activeTab === 'Sections' && <ManageSections />}
      </main>

    </div>
  );
}