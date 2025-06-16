import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Header.css';
import { ImBooks } from 'react-icons/im';
import { FaStar, FaInfoCircle, FaUser } from 'react-icons/fa';
import logo from '../assets/images/ManhwaMate Full logo (White).png';

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [rotatingButton, setRotatingButton] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      return;
    }

    const debounceTimeout = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search-manhwa?q=${encodeURIComponent(searchQuery)}`);
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data);
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        console.error('Error fetching search results:', error);
        setSearchResults([]);
      }
    }, 300); // 300ms debounce delay

    return () => clearTimeout(debounceTimeout);
  }, [searchQuery]);

  const handleIconClick = (path) => {
    setRotatingButton(path);
    setTimeout(() => setRotatingButton(null), 500);
    navigate(path);
  };

  const isActive = (path) => location.pathname === path;

  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
    setShowResults(true);
  };

  const handleResultClick = (id) => {
    setSearchQuery('');
    setShowResults(false);
    navigate(`/manhwa/${id}`);
  };

  const handleBlur = () => {
    // Delay hiding results to allow click event to register
    setTimeout(() => {
      setShowResults(false);
      setSearchFocused(false);
    }, 200);
  };

  const handleFocus = () => {
    setSearchFocused(true);
    if (searchResults.length > 0) {
      setShowResults(true);
    }
  };

  return (
    <header>
      <div className="header-inner">
        <div className="header-logo-container">
          <img
            src={logo}
            alt="ManhwaMate Logo"
            className="header-logo"
            onClick={() => navigate('/')}
          />
        </div>

        <nav className={`nav-container ${searchFocused ? 'nav-move-left' : ''}`}>
          <button
            onClick={() => handleIconClick('/')}
            className={`nav-button ${isActive('/') ? 'active' : ''}`}
          >
            <ImBooks className={`header-icon ${rotatingButton === '/' ? 'rotate' : ''}`} /> Homepage
          </button>
          <button
            onClick={() => handleIconClick('/recommendation')}
            className={`nav-button ${isActive('/recommendation') ? 'active' : ''}`}
          >
            <FaStar className={`header-icon ${rotatingButton === '/recommendation' ? 'rotate' : ''}`} /> Recommendation
          </button>
          <button
            onClick={() => handleIconClick('/about')}
            className={`nav-button ${isActive('/about') ? 'active' : ''}`}
          >
            <FaInfoCircle className={`header-icon ${rotatingButton === '/about' ? 'rotate' : ''}`} /> About
          </button>
        </nav>

        <div className="header-search-container">
          <input
            type="text"
            placeholder="Search..."
            className="header-search-input"
            aria-label="Search"
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
          {showResults && searchResults.length > 0 && (
            <ul className="search-results-list">
              {searchResults.map((result) => (
                <li
                  key={result.id}
                  className="search-result-item"
                  onMouseDown={() => handleResultClick(result.id)}
                >
                  <img src={result.cover} alt={result.title} className="search-result-cover" />
                  <span className="search-result-title">{result.title}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
