import React, { useState, useEffect } from 'react';
import './FilteredGenre.css';
import axios from 'axios';

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
        <p className="loading-text">Loading {selectedGenre} manhwas...</p>
      ) : error ? (
        <p className="error-text">{error}</p>
      ) : (
        <>
          <div className="filtered-manhwa-wrapper">
            {currentManhwas.length > 0 ? (
              currentManhwas.map((manhwa) => (
                <div key={manhwa.id} className="filtered-manhwa-item">
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
    </div>
  );
}

export default FilteredGenre;
