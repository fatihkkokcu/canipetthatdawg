import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { DndProvider } from 'react-dnd';
import { MultiBackend, TouchTransition, MouseTransition } from 'dnd-multi-backend';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ToastProvider } from './context/ToastContext';
import { AnimalDragLayer } from './components/AnimalDragLayer';

const HomePage = lazy(() =>
  import('./pages/HomePage').then((module) => ({ default: module.HomePage }))
);
const BucketListPage = lazy(() =>
  import('./pages/BucketListPage').then((module) => ({ default: module.BucketListPage }))
);
const MapPage = lazy(() =>
  import('./pages/MapPage').then((module) => ({ default: module.MapPage }))
);
const QuizPage = lazy(() =>
  import('./pages/QuizPage').then((module) => ({ default: module.QuizPage }))
);
const AnimalDetailPage = lazy(() =>
  import('./pages/AnimalDetailPage').then((module) => ({ default: module.AnimalDetailPage }))
);

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
          <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />
            {/* Custom drag preview layer (front face only) */}
            <AnimalDragLayer />
            <main className="flex-1">
              <Suspense fallback={<div className="px-4 py-6 text-center text-gray-600">Loading...</div>}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/animal/:animalId" element={<AnimalDetailPage />} />
                  <Route path="/bucket-list" element={<BucketListPage />} />
                  <Route path="/map" element={<MapPage />} />
                  <Route path="/quiz" element={<QuizPage />} />
                </Routes>
              </Suspense>
            </main>
            <Footer />
          </div>
        </ToastProvider>
      </Router>
    </DndProvider>
  );
}

export default App;
