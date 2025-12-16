import React, { useState } from 'react';
import { Outlet, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const CompanyLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const currentSection = searchParams.get('section') || 'drives';

  const menuItems = [
    { label: 'Dashboard', section: 'drives', icon: '📊' },
    { label: 'Create Drive', section: 'create-drive', icon: '➕' },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar - Desktop */}
      <div className="hidden md:flex md:w-64 md:bg-slate-800 md:text-white md:flex-col md:sticky md:top-0">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-2xl font-bold">Company Portal</h2>
          <p className="text-sm text-slate-400 mt-2">
            {user?.name || user?.email}
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.section}
              onClick={() => navigate(`?section=${item.section}`)}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${
                currentSection === item.section
                  ? 'bg-slate-600 text-white'
                  : 'hover:bg-slate-700'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-slate-800 text-white p-4 flex justify-between items-center z-40">
        <h2 className="text-lg font-bold">Company Portal</h2>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-2xl"
        >
          ☰
        </button>
      </div>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-800 text-white z-30 pt-16 md:hidden">
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.section}
                onClick={() => {
                  navigate(`?section=${item.section}`);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${
                  currentSection === item.section
                    ? 'bg-slate-600 text-white'
                    : 'hover:bg-slate-700'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-slate-700">
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto md:mt-0 mt-16">
        <div className="p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default CompanyLayout;
