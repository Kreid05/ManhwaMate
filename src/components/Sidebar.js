import React from 'react';
import './Sidebar.css';
import logo from '../assets/images/ManhwaMate Full logo (White).png';

// Define genre list
const genres = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Historical', 'Horror', 'Isekai',
  'Magical Girls', 'Mecha', 'Mystery', 'Philosophical',
  'Romance', 'Sci-Fi', 'Sports', 'Thriller',
];

const Sidebar = ({ selectedGenre, onGenreClick, slideDirection }) => {
  return (
    <div className={`sidebar-container ${slideDirection}`}>
      <h3 className="sidebar-title">Genre</h3>
      <ul className="sidebar-list">
        {genres.map((genre, index) => (
          <li
            key={index}
            className={`sidebar-item ${selectedGenre === genre ? 'active' : ''}`}
            onClick={() => onGenreClick(genre)}
          >
            {genre}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
