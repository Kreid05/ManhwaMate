import React, { useState, useEffect } from 'react';
import './FilteredGenre.css';
import axios from 'axios';
import ManhwaDetails from './ManhwaDetails';  // Import ManhwaDetails component
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

// Maximum Title Length before truncation
const MAX_TITLE_LENGTH = 25;

// Truncate long titles
const truncateTitle = (title) => {
  return title.length > MAX_TITLE_LENGTH
    ? `${title.substring(0, MAX_TITLE_LENGTH)}...`
    : title;
};

function FilteredGenre({ selectedGenre }) {
  const [manhwas, setManhwas] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedManhwa, setSelectedManhwa] = useState(null);  // State for selected manhwa modal
  const itemsPerPage = 36;

  // Fetch manhwas by selected genre
  useEffect(() => {
    const fetchGenreManhwas = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get('http://localhost:5000/api/genre-manhwa', {
          params: { genre: selectedGenre },
        });
        setManhwas(response.data);
      } catch (error) {
        console.error('Error fetching genre manhwas:', error);
        setError('Failed to fetch manhwas. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchGenreManhwas();
  }, [selectedGenre]);

  // Handle manhwa click to show details modal
  const handleManhwaClick = async (manhwa) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/manhwa/${manhwa.id}`);
      setSelectedManhwa(response.data);
    } catch (error) {
      console.error('Error fetching detailed manhwa:', error);
      setSelectedManhwa(manhwa); // fallback to existing data if detailed fetch fails
    }
  };

  // Handle closing the modal
  const handleBackFromDetails = () => {
    setSelectedManhwa(null);
  };

  // Get current items for pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentManhwas = manhwas.slice(indexOfFirstItem, indexOfLastItem);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="filtered-genre-container">
      <h2 className="filtered-title">{selectedGenre}</h2>

      {/* Show loading spinner */}
      {loading ? (
        <div className="loading-animation-container">
          <DotLottieReact
            src="https://lottie.host/4e0be6ca-f4d1-46f6-9158-048f7d94cf72/NsXuCv2WKG.lottie"
            loop
            autoplay
          />
        </div>
      ) : error ? (
        <p className="error-text">{error}</p>
      ) : (
        <>
          <div className="filtered-manhwa-wrapper">
            {currentManhwas.length > 0 ? (
              currentManhwas.map((manhwa) => (
                <div
                  key={manhwa.id}
                  className="filtered-manhwa-item"
                  onClick={() => handleManhwaClick(manhwa)}
                  style={{ cursor: 'pointer' }}
                >
                  <img
                    src={manhwa.cover}
                    alt={manhwa.title}
                    className="filtered-manhwa-image"
                  />
                  <div className="filtered-manhwa-overlay">
                    <p className="filtered-manhwa-title">
                      {truncateTitle(manhwa.title)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-results">No manhwas found in this genre.</p>
            )}
          </div>

          {/* Pagination Section */}
          {manhwas.length > itemsPerPage && (
            <div className="pagination-container">
              {Array.from({ length: Math.ceil(manhwas.length / itemsPerPage) }).map(
                (_, index) => (
                  <button
                    key={index}
                    onClick={() => paginate(index + 1)}
                    className={`pagination-button ${
                      currentPage === index + 1 ? 'active' : ''
                    }`}
                  >
                    {index + 1}
                  </button>
                )
              )}
            </div>
          )}
        </>
      )}

      {/* Modal for Manhwa Details */}
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

export default FilteredGenre;
