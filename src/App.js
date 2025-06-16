import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import './App.css';
import Home from './components/Home';
import About from './components/About';
import Recommendation from './components/Recommendation';
import Header from './components/Header';
import Sidebar from './components/Sidebar';

function App() {
  const [slideDirection, setSlideDirection] = useState('slide-in');
  const location = useLocation();

  // Detect route changes to update sidebar animation
  useEffect(() => {
    if (location.pathname === '/') {
      // Slide in when going back to homepage
      setSlideDirection('slide-in');
    } else {
      // Slide out for other pages
      setSlideDirection('slide-out');
    }
  }, [location.pathname]);

  return (
    <div className="App">
      {/* Sidebar with animation */}
      <Sidebar slideDirection={slideDirection} />

      {/* Header Component */}
      <Header />

      {/* Define Routes */}
      <Routes>
        <Route path="/" element={<Home data={[]} />} />
        <Route path="/recommendation" element={<Recommendation />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </div>
  );
}

// Wrap App with Router
function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}

export default AppWrapper;
