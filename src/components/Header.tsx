import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Heart, Map, Target, Menu, X } from 'lucide-react';
import { SearchBar } from './SearchBar';

export const Header: React.FC = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { to: '/', text: 'Home', icon: <Home className="h-4 w-4" /> },
    { to: '/bucket-list', text: 'Bucket List', icon: <Heart className="h-4 w-4" /> },
    { to: '/map', text: 'Map', icon: <Map className="h-4 w-4" /> },
    { to: '/quiz', text: 'Quiz', icon: <Target className="h-4 w-4" /> },
  ];

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-4">
          <Link to="/" className="flex items-center space-x-3">
            <img
              src="/frog-logo.png"
              alt="CanIPetThatDawg logo"
              className="w-12 h-12 object-contain"
              loading="eager"
              decoding="sync"
            />
            <h1 className="text-xl font-bold text-gray-900 sm:block">CanIPetThat<span className="text-blue-600">Dawg</span></h1>
          </Link>

          <div className="flex-1 max-w-xl mx-4 hidden md:block">
            <SearchBar />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-2">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                  location.pathname === link.to
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {link.icon}
                <span className="hidden lg:inline">{link.text}</span>
              </Link>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 hover:text-gray-800"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation & Search */}
        <div
          className={`transition-all duration-300 ease-in-out md:hidden ${
            isMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
          } overflow-hidden`}
        >
          <div className="pt-2 pb-4">
            <div className="px-2 pb-4">
              <SearchBar />
            </div>
            <nav className="flex flex-col space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 ${
                    location.pathname === link.to
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {link.icon}
                  <span>{link.text}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};
