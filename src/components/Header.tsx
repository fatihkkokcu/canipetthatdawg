import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Heart, Map, Target } from 'lucide-react';
import { SearchBar } from './SearchBar';

export const Header: React.FC = () => {
  const location = useLocation();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-4">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">🐕</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 hidden sm:block">CanIPetThatDawg</h1>
          </Link>

          {/* Search bar in header */}
          <div className="flex-1 max-w-md mx-4">
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