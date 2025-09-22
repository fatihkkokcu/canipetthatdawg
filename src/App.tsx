import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Header } from './components/Header';
import { HomePage } from './pages/HomePage';
import { BucketListPage } from './pages/BucketListPage';
import { MapPage } from './pages/MapPage';
import { QuizPage } from './pages/QuizPage';

function App() {
  return (
    <DndProvider backend={HTML5Backend}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/bucket-list" element={<BucketListPage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/quiz" element={<QuizPage />} />
          </Routes>
        </div>
      </Router>
    </DndProvider>
  );
}

export default App;