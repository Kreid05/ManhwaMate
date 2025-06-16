import React from 'react';
import './ManhwaDetails.css';

import AmazonLogo from '../assets/site_logos/Amazon_logo.jpg';
import AniListLogo from '../assets/site_logos/AniList_logo.png';
import AnimePlanetLogo from '../assets/site_logos/AnimePlanet_logo.jpg';
import BookWalkerLogo from '../assets/site_logos/BookWalker_logo.png';
import CDjapanLogo from '../assets/site_logos/CDjapan_logo.jpg';
import EbookJapanLogo from '../assets/site_logos/EbookJapan_logo.jpg';
import KitsuLogo from '../assets/site_logos/Kitsu_logo.png';
import MangaUpdatesLogo from '../assets/site_logos/MangaUpdates_logo.png';
import MyAnimeListLogo from '../assets/site_logos/MyAnimeList_logo.png';
import NovelUpdatesLogo from '../assets/site_logos/NovelUpdates_logo.png';

const logoMap = {
  amazon: AmazonLogo,
  anilist: AniListLogo,
  animeplanet: AnimePlanetLogo,
  bookwalker: BookWalkerLogo,
  cdjapan: CDjapanLogo,
  ebookjapan: EbookJapanLogo,
  kitsu: KitsuLogo,
  mangaupdates: MangaUpdatesLogo,
  myanimelist: MyAnimeListLogo,
  novelupdates: NovelUpdatesLogo,
};

const ManhwaDetails = ({ manhwa, onBack }) => {
  if (!manhwa) return null;

  // Convert totalChapters to string for consistent display
  const totalChapters = manhwa.totalChapters !== undefined && manhwa.totalChapters !== null
    ? String(manhwa.totalChapters)
    : 'Unknown';

  // Helper to get logo for a publisher name
  const getLogoForPublisher = (name) => {
    if (!name) return null;
    const key = name.toLowerCase().replace(/\\s+/g, '').replace(/[^a-z]/g, '');
    return logoMap[key] || null;
  };

  return (
    <div className="manhwa-details-container">
      <div className="manhwa-left-panel">
        <img
          src={manhwa.cover || ''}
          alt={manhwa.title || 'Manhwa Cover'}
          className="manhwa-cover-image"
        />
        <h2 className="manhwa-title">{manhwa.title || 'No Title'}</h2>
        <p className="manhwa-author"><em>{manhwa.author || 'Unknown Author'}</em></p>
        <p className="manhwa-genres">
          {manhwa.genres && manhwa.genres.length > 0
            ? manhwa.genres.join(', ')
            : 'No genres'}
        </p>
        <div className="manhwa-chapters-status">
          <p>{totalChapters !== 'Unknown' ? `${totalChapters} Chapters` : 'Unknown Chapters'}</p>
          <p>{manhwa.status || 'Unknown status'}</p>
        </div>
      </div>
      <div className="manhwa-right-panel">
        <section className="manhwa-summary-section">
          <h3 className="section-heading">Summary:</h3>
          {manhwa.summary ? manhwa.summary.split('\\n').map((line, idx) => (
            <p key={idx}>{line}</p>
          )) : <p>No summary available</p>}
        </section>

        <section className="manhwa-info-section">
          <h3 className="section-heading">Published Year:</h3>
          <p>{manhwa.publishedYear || 'Unknown'}</p>

          <h3 className="section-heading">Artist(s):</h3>
          <p>{manhwa.artist || 'Unknown'}</p>

          <h3 className="section-heading">Associated Name:</h3>
          <p>
            {manhwa.associatedNames && manhwa.associatedNames.length > 0 ? manhwa.associatedNames.map((name, idx) => (
              <React.Fragment key={idx}>
                {name}<br />
              </React.Fragment>
            )) : 'None'}
          </p>

          <h3 className="section-heading">Official Sites:</h3>
          <div className="publisher-buttons">
            {manhwa.officialSites && manhwa.officialSites.length > 0 ? (
              manhwa.officialSites.map((site, idx) => {
                const logo = getLogoForPublisher(site.name);
                return (
                  <a
                    key={idx}
                    href={site.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`publisher-button publisher-button-${site.name.toLowerCase().replace(/\\s+/g, '').replace(/[^a-z]/g, '')}`}
                  >
                    {logo && <img src={logo} alt={`${site.name} logo`} className="publisher-logo" />}
                    {site.name}
                  </a>
                );
              })
            ) : (
              <p>{manhwa.publishers && manhwa.publishers.length > 0 ? manhwa.publishers.join(', ') : 'Unknown'}</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ManhwaDetails;
