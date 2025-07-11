import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import SemesterSelector from './SemesterSelector';
import {
  FaBook,
  FaCalendarAlt,
  FaChalkboardTeacher,
  FaClipboardList,
  FaCog,
  FaGraduationCap,
  FaUsers,
  FaTimes
} from 'react-icons/fa';
import { useTheme } from '../App';

const menuItems = [
  {
    title: 'Academic',
    items: [
      { name: 'Courses', icon: <FaBook />, path: '/dashboard/courses' },
      { name: 'Schedule', icon: <FaCalendarAlt />, path: '/dashboard/schedule' },
      { name: 'Assignments', icon: <FaClipboardList />, path: '/dashboard/assignments' }
    ]
  },
  {
    title: 'Class',
    items: [
      { name: 'Students', icon: <FaUsers />, path: '/dashboard/students' },
      { name: 'Faculty', icon: <FaChalkboardTeacher />, path: '/dashboard/faculty' },
      { name: 'Results', icon: <FaGraduationCap />, path: '/dashboard/results' }
    ]
  },
  {
    title: 'Settings',
    items: [
      { name: 'Preferences', icon: <FaCog />, path: '/dashboard/settings' }
    ]
  }
];

const Sidebar = ({ isSidebarOpen, setIsSidebarOpen }) => {
  const location = useLocation();
  const { theme } = useTheme();
  
  // Function to determine if a menu item is active
  const isMenuItemActive = (path) => location.pathname === path;

  return (
    <aside
      className={`
        fixed top-[64px] bottom-0 left-0 z-40 w-64 shadow-lg transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 md:top-0 ${theme.sidebar}
      `}
    >
      <div className="flex flex-col h-full">
        {/* Sidebar Header */}
        <div className={`p-4 border-b ${theme.text} ${theme.bg}`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-xl font-semibold ${theme.text}`}>Dashboard</h2>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className={`md:hidden p-2 rounded-lg ${theme.button}`}
            >
              <FaTimes className="h-5 w-5" />
            </button>
          </div>
          {/* Semester Selector */}
          <div className="mt-4">
            <SemesterSelector />
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          {menuItems.map((section, index) => (
            <div key={index} className="mb-6">
              <h3 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${theme.text} opacity-70`}>
                {section.title}
              </h3>
              <ul className="space-y-1">
                {section.items.map((item, itemIndex) => (
                  <li key={itemIndex}>
                    <Link
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                        ${theme.text}
                        ${isMenuItemActive(item.path)
                          ? 'bg-primary/10 text-blue-500 font-semibold'
                          : 'hover:bg-primary/5'}
                      `}
                    >
                      {item.icon}
                      <span>{item.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar; 