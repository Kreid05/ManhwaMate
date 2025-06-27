import React, { useState, useEffect, useRef } from 'react';
import './Home.css';
import axios from 'axios';
import { io } from 'socket.io-client';
import FilteredGenre from './FilteredGenre';
import Sidebar from './Sidebar';
import ManhwaDetails from './ManhwaDetails';

// Limit Summary to 120 characters
const truncateSummary = (summary) => {  
  const MAX_SUMMARY_LENGTH = 600;
  if (!summary) return 'No summary available';
  return summary.length > MAX_SUMMARY_LENGTH
    ? `${summary.substring(0, MAX_SUMMARY_LENGTH)}...`
    : summary;
};

// Maximum Title Length before truncation
const MAX_TITLE_LENGTH = 30;
  

function Home() {
  const [featuredManhwas, setFeaturedManhwas] = useState([]);
  const [latestManhwas, setLatestManhwas] = useState([]);
  const [popularManhwas, setPopularManhwas] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [selectedManhwa, setSelectedManhwa] = useState(null);

  // Carousel State and Ref
  const carouselRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Truncate long titles
  const truncateTitle = (title) => {
    if (!title) return 'No title available';
    return title.length > MAX_TITLE_LENGTH
      ? `${title.substring(0, MAX_TITLE_LENGTH)}...`
      : title;
  };

  // Fetch latest data with cache-busting parameter
  const fetchManhwaData = async () => {
    try {
      const timestamp = new Date().getTime(); // Add timestamp to avoid cache
      const [featuredResponse, latestResponse, popularResponse] = await Promise.all([
        axios.get(`https://manhwamate-1.onrender.com/api/featured-manhwa?nocache=${timestamp}`),
        axios.get(`https://manhwamate-1.onrender.com/api/latest-manhwa?nocache=${timestamp}`),
        axios.get(`https://manhwamate-1.onrender.com/popular-manhwa?nocache=${timestamp}`),
      ]);

      setFeaturedManhwas(featuredResponse.data);
      setLatestManhwas(latestResponse.data);
      setPopularManhwas(popularResponse.data);
    } catch (error) {
      console.error('Error fetching manhwas:', error);
    }
  };

  useEffect(() => {
    // Initial fetch on page load
    fetchManhwaData();

    // Connect to WebSocket for real-time updates
    const socket = io('https://manhwamate-1.onrender.com/');

    // Listen for real-time updates for all manhwa categories
    socket.on('update-manhwa', (data) => {
      setFeaturedManhwas(data.featuredManhwas || []);
      setLatestManhwas(data.latestManhwas || []);
      setPopularManhwas(data.popularManhwas || []);
    });

    // Clean up WebSocket connection
    return () => {
      socket.off('update-manhwa');
      socket.disconnect();
    };
  }, []);

  // Auto-slide carousel every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === featuredManhwas.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [featuredManhwas]);

  // Scroll to the current item smoothly
  useEffect(() => {
    if (carouselRef.current && featuredManhwas.length > 0) {
      const scrollWidth = carouselRef.current.scrollWidth;
      const itemWidth = scrollWidth / featuredManhwas.length;
      carouselRef.current.scrollTo({
        left: currentIndex * itemWidth,
        behavior: 'smooth',
      });
    }
  }, [currentIndex, featuredManhwas]);

  // Handle genre click to set selected genre
  const handleGenreClick = (genre) => {
    setSelectedGenre(genre);
  };

  // Reset genre selection
  const resetGenreSelection = () => {
    setSelectedGenre(null);
  };

  // Handle manhwa click to show details
  const handleManhwaClick = async (manhwa) => {
    try {
      const response = await axios.get(`https://manhwamate-1.onrender.com/api/manhwa/${manhwa.id}`);
      setSelectedManhwa(response.data);
    } catch (error) {
      console.error('Error fetching detailed manhwa:', error);
      setSelectedManhwa(manhwa); // fallback to existing data if detailed fetch fails
    }
  };

  // Handle back from details to list
  const handleBackFromDetails = () => {
    setSelectedManhwa(null);
  };

  return (
    <div className="home-layout">
      <Sidebar selectedGenre={selectedGenre} onGenreClick={handleGenreClick} />
      <div className="content-container" style={{ filter: selectedManhwa ? 'blur(2px)' : 'none', pointerEvents: selectedManhwa ? 'none' : 'auto' }}>
        {selectedGenre ? (
          <>
            <button className="reset-button" onClick={resetGenreSelection}>
              Back to Main Content
            </button>
            <FilteredGenre selectedGenre={selectedGenre} />
          </>
        ) : (
          <>
            {/* Featured Manhwa with Carousel */}
            <h2 className="featured-title">Featured Manhwa/Manga</h2>
            <div className="featured-wrapper" ref={carouselRef}>
              <div className="featured-manhwa-container">
                {featuredManhwas.length > 0 ? (
                  featuredManhwas.map((manhwa, index) => (
                    <div
                      key={manhwa.id || index}
                      className={`featured-manhwa-item ${
                        index === currentIndex ? 'active' : ''
                      }`}
                      onClick={() => handleManhwaClick(manhwa)}
                      style={{ cursor: 'pointer' }}
                    >
                      <img
                        src={manhwa.cover}
                        alt={manhwa.title || 'No title available'}
                        className="featured-manhwa-image"
                      />
                      <div className="featured-manhwa-overlay">
                        <p className="featured-manhwa-title">
                          {truncateTitle(manhwa.title)}
                        </p>
                      </div>
                      <div className="featured-manhwa-summary">
                        {truncateSummary(manhwa.summary) || 'No summary available'}
                      </div>
                    </div>
                  ))
                ) : (
                  <p>Loading featured manhwas...</p>
                )}
              </div>
            </div>
            {/* Latest Manhwa */}
            <div className="latest-wrapper">
              <h2 className="latest-title">Latest Manhwa/Manga</h2>
              <div className="latest-manhwa-container">
                {latestManhwas.length > 0 ? (
                  latestManhwas.map((manhwa, index) => (
                    <div
                      key={manhwa.id || index}
                      className="latest-manhwa-item"
                      onClick={() => handleManhwaClick(manhwa)}
                      style={{ cursor: 'pointer' }}
                    >
                      <img
                        src={manhwa.cover}
                        alt={manhwa.title || 'No title available'}
                        className="latest-manhwa-image"
                      />
                      <div className="latest-manhwa-overlay">
                        <p className="latest-manhwa-title">
                          {truncateTitle(manhwa.title || 'No title available')}
                        </p>
                        <p className="latest-manhwa-chapter">
                          {manhwa.latestChapter
                            ? `Chapter ${manhwa.latestChapter}`
                            : 'No chapter available'}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p>Loading latest manhwas...</p>
                )}
              </div>
            </div>
            {/* Most Popular Manhwa */}
            <div className="popular-wrapper">
              <h2 className="popular-title">Most Popular</h2>
              <div className="popular-manhwa-container">
                {popularManhwas.map((manhwa, index) => (
                  <div
                    key={manhwa.id || index}
                    className="popular-manhwa-item"
                    onClick={() => handleManhwaClick(manhwa)}
                    style={{ cursor: 'pointer' }}
                  >
                    <img
                      src={manhwa.cover}
                      alt={manhwa.title || 'No title available'}
                      className="popular-manhwa-image"
                    />
                    <div className="popular-manhwa-text">
                      <h3>{manhwa.title || 'No title available'}</h3>
                      <p className="popular-chapter">
                        Chapters: {manhwa.totalChapters || 'Unknown'}
                      </p>
                      <p className="popular-summary">
                        {manhwa.summary && manhwa.summary.length > 0
                          ? manhwa.summary
                          : 'No summary available'}
                      </p>
                    </div>
                    <div className="popular-manhwa-info">
                      <p>
                        <strong>Author:</strong> {manhwa.author || 'Unknown'}
                      </p>
                      <p>
                        <strong>Artist:</strong> {manhwa.artist || 'Unknown'}
                      </p>
                      <p>
                        <strong>Rating:</strong>{' '}
                        {manhwa.rating
                          ? manhwa.rating.split('(')[0].trim()
                          : 'No rating'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
      {selectedManhwa && (
        <div className="modal-overlay" onClick={handleBackFromDetails}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <ManhwaDetails manhwa={selectedManhwa} onBack={handleBackFromDetails} />
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;