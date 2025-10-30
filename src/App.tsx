import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { DndProvider } from 'react-dnd';
import { MultiBackend, TouchTransition, MouseTransition } from 'dnd-multi-backend';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { Header } from './components/Header';
import { ToastProvider } from './context/ToastContext';
import { HomePage } from './pages/HomePage';
import { BucketListPage } from './pages/BucketListPage';
import { MapPage } from './pages/MapPage';
import { QuizPage } from './pages/QuizPage';
import { AnimalDragLayer } from './components/AnimalDragLayer';

const HTML5toTouchOptions = {
  backends: [
    {
      id: 'html5',
      backend: HTML5Backend,
      transition: MouseTransition,
      preview: true,
    },
    {
      id: 'touch',
      backend: TouchBackend,
      options: {
        enableMouseEvents: true,
        delayTouchStart: 300,
      },
      transition: TouchTransition,
      preview: true,
    },
  ],
};

function App() {
  return (
    <DndProvider backend={MultiBackend} options={HTML5toTouchOptions}>
      <Router>
        <ToastProvider>
          <div className="min-h-screen bg-gray-50">
            <Header />
            {/* Custom drag preview layer (front face only) */}
            <AnimalDragLayer />
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/bucket-list" element={<BucketListPage />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="/quiz" element={<QuizPage />} />
            </Routes>
          </div>
        </ToastProvider>
      </Router>
    </DndProvider>
  );
}

export default App;
