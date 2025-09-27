import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Heart, Map, Target } from 'lucide-react';
import { SearchBar } from './SearchBar';

export const Header: React.FC = () => {
  const location = useLocation();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-18">
        <div className="flex justify-between items-center h-16 gap-4">
          <Link to="/" className="flex items-center space-x-3">
            {/* Logo image placed in public/frog-logo.png */}
            <img
              src="/frog-logo.png"
              alt="CanIPetThatDawg logo"
              className="w-12 h-12 object-contain"
              loading="eager"
              decoding="sync"
            />
            <h1 className="text-xl font-bold text-gray-900 hidden sm:block">CanIPetThat<span className="text-blue-600">Dawg</span></h1>
          </Link>

          {/* Search bar in header */}
          <div className="flex-1 max-w-xl mx-4">
            <SearchBar />
          </div>

          <nav className="flex items-center space-x-4">
            <Link
              to="/"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                location.pathname === '/' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Home</span>
            </Link>
            <Link
              to="/bucket-list"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                location.pathname === '/bucket-list' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">Bucket List</span>
            </Link>
            <Link
              to="/map"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                location.pathname === '/map' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Map className="h-4 w-4" />
              <span className="hidden sm:inline">Map</span>
            </Link>
            <Link
              to="/quiz"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                location.pathname === '/quiz' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Quiz</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};
