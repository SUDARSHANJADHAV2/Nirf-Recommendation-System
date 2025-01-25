import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ChartBar, FileText, Settings, Database } from 'lucide-react';

const Navbar: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white shadow-md z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-blue-600">
              NIRF Analytics
            </Link>
          </div>
          
          <div className="flex space-x-4">
            <NavLink 
              to="/" 
              icon={<Home className="w-5 h-5" />} 
              text="Dashboard" 
              active={location.pathname === '/'} 
            />
            <NavLink 
              to="/analytics" 
              icon={<ChartBar className="w-5 h-5" />} 
              text="Analytics" 
              active={location.pathname === '/analytics'} 
            />
            <NavLink 
              to="/reports" 
              icon={<FileText className="w-5 h-5" />} 
              text="Reports" 
              active={location.pathname === '/reports'} 
            />
            <NavLink 
              to="/data-management" 
              icon={<Database className="w-5 h-5" />} 
              text="Data" 
              active={location.pathname === '/data-management'} 
            />
            <NavLink 
              to="/settings" 
              icon={<Settings className="w-5 h-5" />} 
              text="Settings" 
              active={location.pathname === '/settings'} 
            />
          </div>
        </div>
      </div>
    </nav>
  );
};

interface NavLinkProps {
  to: string;
  icon: React.ReactNode;
  text: string;
  active: boolean;
}

const NavLink: React.FC<NavLinkProps> = ({ to, icon, text, active }) => {
  return (
    <Link 
      to={to} 
      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
        active 
          ? 'text-blue-600 bg-blue-50' 
          : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100'
      }`}
    >
      {icon}
      <span className="ml-2">{text}</span>
    </Link>
  );
};

export default Navbar;