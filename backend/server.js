const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');

const { getChatbotResponse } = require('./chatbot'); // Import chatbot handler

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

app.use(bodyParser.json());
app.use(cors());

// Base URL for MangaDex API
const MANGADEX_API_URL = 'https://api.mangadex.org';

// Store manhwa data in memory for real-time updates
let featuredManhwas = [];
let latestManhwas = [];
let popularManhwas = [];

// Function to map genre name to MangaDex tag IDs
const getGenreId = (genre) => {
  const genreMap = {
    Action: '391b0423-d847-456f-aff0-8b0cfc03066b',
    Adventure: '4d32cc48-9f00-4cca-9b5a-a839f0764984',
    Comedy: '4d32cc48-9f00-4cca-9b5a-a839f0764984',
    Drama: 'b9af3a63-f058-46de-a9a0-e0c13906197a',
    Fantasy: 'cdc58593-87dd-415e-bbc0-2ec27bf404cc',
    Historical: '33771934-028e-4cb3-8744-691e866a923e',
    Horror: 'cdad7e68-1419-41dd-bdce-27753074a640',
    Isekai: 'ace04997-f6bd-436e-b261-779182193d3d',
    'Magical Girls': '81c836c9-914a-4eca-981a-560dad663e73',
    Mecha: 'caaa44eb-cd40-4177-b930-79d3ef2afe87',
    Mystery: 'ee968100-4191-4968-93d3-f82d72be7e46',
    Philosophical: 'a1f53773-c69a-4ce5-8cab-fffcd90b1565',
    Romance: '423e2eae-a7a2-4a8b-ac03-a8351462d71d',
    SciFi: '256c8bd9-4904-4360-bf4f-508a76d67183',
    Sports: 'a3c67850-4684-404e-9b7f-c69850ee5da6',
    Thriller: '07251805-a27e-4d59-b488-f0bfbec15168',
  };

  return genreMap[genre] || '';
};

// Get Featured Manhwa (Top 8 by popularity with summary)
const fetchFeaturedManhwas = async () => {
  try {
    const response = await axios.get(`${MANGADEX_API_URL}/manga`, {
      params: {
        limit: 8,
        order: { followedCount: 'desc' },
        includes: ['cover_art'],
      },
    });

    featuredManhwas = response.data.data.map((manga) => ({
      id: manga.id,
      title: manga.attributes.title.en || 'No title available',
      cover: manga.relationships.find((rel) => rel.type === 'cover_art')
        ? `https://uploads.mangadex.org/covers/${manga.id}/${manga.relationships.find((rel) => rel.type === 'cover_art').attributes.fileName}`
        : 'https://via.placeholder.com/150',
      summary: manga.attributes.description?.en || 'No summary available',
    }));
  } catch (err) {
    console.error('Error fetching featured manhwa:', err.message);
  }
};

// Get Latest Manhwa (Ensure Exactly 16 Entries)
const fetchLatestManhwas = async () => {
  try {
    const response = await axios.get(`${MANGADEX_API_URL}/manga`, {
      params: {
        limit: 50, // Increase limit to get extra data if needed
        order: { latestUploadedChapter: 'desc' },
        includes: ['cover_art'],
      },
    });

    let manhwasWithChapters = await Promise.all(
      response.data.data.map(async (manga) => {
        try {
          const chapterResponse = await axios.get(`${MANGADEX_API_URL}/chapter`, {
            params: {
              limit: 1,
              manga: manga.id,
              translatedLanguage: ['en'],
              order: { readableAt: 'desc' },
            },
          });
    
          const latestChapterData = chapterResponse.data.data[0];
    
          return {
            id: manga.id,
            title: manga.attributes.title?.en || manga.attributes.title?.['ja-ro'] || manga.attributes.title?.['ja'] || 'No title available',
            cover: manga.relationships.find((rel) => rel.type === 'cover_art')
              ? `https://uploads.mangadex.org/covers/${manga.id}/${manga.relationships.find((rel) => rel.type === 'cover_art').attributes.fileName}`
              : 'https://via.placeholder.com/150',
            latestChapter: latestChapterData?.attributes?.chapter || 'No chapter available',
            readableAt: latestChapterData?.attributes?.readableAt || '',
          };
        } catch (err) {
          console.error(`Error fetching latest chapters: ${err.message}`);
          return null; // Skip errors
        }
      })
    );    

    // Remove null values, sort, and take 16 items
    manhwasWithChapters = manhwasWithChapters
      .filter((manga) => manga !== null && manga.readableAt)
      .sort((a, b) => new Date(b.readableAt) - new Date(a.readableAt))
      .slice(0, 16);

    // Ensure 16 entries are displayed (use placeholder if fewer than 16)
    if (manhwasWithChapters.length < 16) {
      const emptyEntries = Array(16 - manhwasWithChapters.length).fill({
        id: 'empty',
        title: 'No title available',
        cover: 'https://via.placeholder.com/150',
        latestChapter: 'No chapter available',
      });
      latestManhwas = [...manhwasWithChapters, ...emptyEntries];
    } else {
      latestManhwas = manhwasWithChapters;
    }
  } catch (err) {
    console.error('❌ Error fetching latest manhwa:', err.message);
  }
};

// Get Most Popular Manhwa (Top 10 by rating with total chapters)
const fetchPopularManhwas = async () => {
  try {
    const response = await axios.get(`${MANGADEX_API_URL}/manga`, {
      params: {
        limit: 10,
        order: { rating: 'desc' },
        includes: ['cover_art', 'author', 'artist'],
      },
    });

    popularManhwas = await Promise.all(
      response.data.data.map(async (manga) => {
        try {
          // Fetch Total Number of Chapters
          const chapterCountResponse = await axios.get(`${MANGADEX_API_URL}/chapter`, {
            params: {
              manga: manga.id,
              translatedLanguage: ['en'],
              limit: 1,
              order: { chapter: 'desc' },
            },
          });

          const totalChapters =
            chapterCountResponse.data.data.length > 0
              ? chapterCountResponse.data.data[0].attributes.chapter || 'Unknown'
              : 'Unknown';

          // Fetch Rating and Stats
          const statsResponse = await axios.get(`${MANGADEX_API_URL}/statistics/manga/${manga.id}`);
          const statsData = statsResponse.data.statistics[manga.id];
          const totalRating = statsData.rating?.bayesian || 'No rating';
          const totalVotes = statsData.rating?.votes || 0;

          return {
            id: manga.id,
            title: manga.attributes.title.en || 'No title available',
            cover: manga.relationships.find((rel) => rel.type === 'cover_art')
              ? `https://uploads.mangadex.org/covers/${manga.id}/${manga.relationships.find((rel) => rel.type === 'cover_art').attributes.fileName}`
              : 'https://via.placeholder.com/150',
            author: manga.relationships.find((rel) => rel.type === 'author')
              ? manga.relationships.find((rel) => rel.type === 'author').attributes.name
              : 'Unknown Author',
            artist: manga.relationships.find((rel) => rel.type === 'artist')
              ? manga.relationships.find((rel) => rel.type === 'artist').attributes.name
              : 'Unknown Artist',
            summary: manga.attributes.description?.en || 'No summary available',
            totalChapters, // Show total number of chapters
            rating: `${parseFloat(totalRating).toFixed(2)} / 10 (${totalVotes} votes)`,
          };
        } catch (err) {
          console.error(`Error fetching data for ${manga.attributes.title.en}:`, err.message);
          return {
            id: manga.id,
            title: manga.attributes.title.en || 'No title available',
            cover: 'https://via.placeholder.com/150',
            author: 'Unknown Author',
            artist: 'Unknown Artist',
            summary: 'No summary available',
            totalChapters: 'Unknown',
            rating: 'No rating',
          };
        }
      })
    );
  } catch (err) {
    console.error('Error fetching popular manhwa:', err.message);
  }
};

// Get Manhwa by Genre
app.get('/api/genre-manhwa', async (req, res) => {
  const genre = req.query.genre;
  const genreId = getGenreId(genre);

  if (!genreId) {
    return res.status(400).json({ error: 'Invalid genre' });
  }

  try {
    const response = await axios.get(`${MANGADEX_API_URL}/manga`, {
      params: {
        limit: 100,
        includedTags: [genreId],
        includes: ['cover_art'],
        contentRating: ['safe', 'suggestive', 'erotica', 'pornographic'],
        order: { followedCount: 'desc' },
      },
    });

    const genreManhwas = response.data.data.map((manga) => ({
      id: manga.id,
      title: manga.attributes.title.en || 'No title available',
      cover: manga.relationships.find((rel) => rel.type === 'cover_art')
        ? `https://uploads.mangadex.org/covers/${manga.id}/${manga.relationships.find((rel) => rel.type === 'cover_art').attributes.fileName}`
        : 'https://via.placeholder.com/150',
    }));

    res.json(genreManhwas);
  } catch (err) {
    console.error('Error fetching genre manhwa:', err.response?.data?.errors || err.message);
    res.status(500).json({ error: 'Failed to fetch genre manhwa' });
  }
});

// Get a random manhwa
app.get('/api/random-manhwa', async (req, res) => {
  try {
    const response = await axios.get(`${MANGADEX_API_URL}/manga`, {
      params: {
        limit: 100,
        includes: ['cover_art', 'author', 'artist'],
        contentRating: ['safe', 'suggestive'], // Limit to appropriate content
        order: { followedCount: 'desc' }, // Adjust this for randomness control
      },
    });

    const allManhwas = response.data.data;
    const randomManga = allManhwas[Math.floor(Math.random() * allManhwas.length)];

    const coverRel = randomManga.relationships.find((rel) => rel.type === 'cover_art');
    const authorRel = randomManga.relationships.find((rel) => rel.type === 'author');
    const artistRel = randomManga.relationships.find((rel) => rel.type === 'artist');

    const randomManhwa = {
      id: randomManga.id,
      title: randomManga.attributes.title?.en || 'No title available',
      summary: randomManga.attributes.description?.en || 'No summary available',
      cover: coverRel
        ? `https://uploads.mangadex.org/covers/${randomManga.id}/${coverRel.attributes.fileName}`
        : 'https://via.placeholder.com/300x400.png?text=No+Cover',
      author: authorRel?.attributes?.name || 'Unknown Author',
      artist: artistRel?.attributes?.name || 'Unknown Artist',
      year: randomManga.attributes.year || 'Unknown',
    };

    res.json(randomManhwa);
  } catch (error) {
    console.error('Error fetching random manhwa:', error.message);
    res.status(500).json({ error: 'Failed to fetch random manhwa' });
  }
});

// Fetch Initial Data on Server Start
const initializeData = async () => {
  await fetchFeaturedManhwas();
  await fetchLatestManhwas();
  await fetchPopularManhwas();
};

initializeData();

// API Endpoints
app.get('/api/featured-manhwa', (req, res) => res.json(featuredManhwas));
app.get('/api/latest-manhwa', (req, res) => res.json(latestManhwas));
app.get('/api/popular-manhwa', (req, res) => res.json(popularManhwas));

// Emit Updated Manhwa Data via WebSocket
const sendManhwaUpdates = () => {
  io.emit('update-manhwa', {
    featuredManhwas,
    latestManhwas,
    popularManhwas,
  });
};

// Periodically Fetch and Update Manhwa Data
setInterval(async () => {
  console.log('Updating manhwa data...');
  await fetchFeaturedManhwas();
  await fetchLatestManhwas(); // Latest updates included
  await fetchPopularManhwas();
  sendManhwaUpdates(); // Emit updated data to clients
}, 30000); // Update every 30 seconds


// WebSocket Connection
io.on('connection', (socket) => {
  console.log('A user connected');

  // Send initial data when a client connects
  socket.emit('update-manhwa', { featuredManhwas, latestManhwas, popularManhwas });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});


  // Chatbot API route
  app.post('/api/chatbot', async (req, res) => {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    try {
      const reply = await getChatbotResponse(message);
      res.json({ reply });
    } catch (error) {
      console.error('Error in chatbot route:', error.message);
      res.status(500).json({ error: 'Failed to get chatbot response' });
    }
  });


// New API endpoint to get detailed manhwa info by ID
app.get('/api/manhwa/:id', async (req, res) => {
  const manhwaId = req.params.id;

  try {
    const response = await axios.get(`${MANGADEX_API_URL}/manga/${manhwaId}`, {
      params: {
        includes: ['cover_art', 'author', 'artist', 'tag', 'publisher'],
      },
    });

    const manga = response.data.data;

    // Extract cover image
    const coverRel = manga.relationships.find((rel) => rel.type === 'cover_art');
    const cover = coverRel
      ? `https://uploads.mangadex.org/covers/${manhwaId}/${coverRel.attributes.fileName}`
      : 'https://via.placeholder.com/150';

    // Extract author(s)
    const authors = manga.relationships
      .filter((rel) => rel.type === 'author')
      .map((author) => author.attributes.name);
    const author = authors.length > 0 ? authors.join(', ') : 'Unknown Author';

    // Extract artist(s)
    const artists = manga.relationships
      .filter((rel) => rel.type === 'artist')
      .map((artist) => artist.attributes.name);
    const artist = artists.length > 0 ? artists.join(', ') : 'Unknown Artist';

    // Extract publishers
    const publishers = manga.relationships
      .filter((rel) => rel.type === 'publisher')
      .map((publisher) => publisher.attributes.name);

    // Extract tags as array of objects with name property
    const tags = manga.relationships
      .filter((rel) => rel.type === 'tag')
      .map((tag) => ({ name: tag.attributes.name.en || 'Unknown' }));

    // Extract associated names (alternative titles)
    const associatedNames = [];
    const titles = manga.attributes.title;
    for (const key in titles) {
      if (titles.hasOwnProperty(key) && titles[key] !== titles.en) {
        associatedNames.push(titles[key]);
      }
    }

    // Extract other attributes
    const status = manga.attributes.status || 'Unknown status';
    const summary = manga.attributes.description?.en || 'No summary available';
    const publishedYear = manga.attributes.year || 'Unknown';
    const totalChapters = manga.attributes.chapterCount || 'Unknown';

    // Decode manga links field to official site URLs
    const links = manga.attributes.links || {};

    const decodeLink = (key, value) => {
      switch (key) {
        case 'al': // anilist
          return `https://anilist.co/manga/${value}`;
        case 'ap': // animeplanet
          return `https://www.anime-planet.com/manga/${value}`;
        case 'mu': // mangaupdates
          return `https://www.mangaupdates.com/series.html?id=${value}`;
        case 'nu': // novelupdates
          return `https://www.novelupdates.com/series/${value}`;
        case 'kt': // kitsu.io
            return `https://kitsu.app/manga/${value}`;
        case 'amz': // amazon - stored as full URL or N/A
          return value !== 'N/A' ? value : null;
        case 'ebj': // ebookjapan - stored as full URL or N/A
          return value !== 'N/A' ? value : null;
        case 'mal': // myanimelist
          return `https://myanimelist.net/manga/${value}`;
        case 'cdj': // CDJapan - stored as full URL or N/A
          return value !== 'N/A' ? value : null;
        case 'raw': // raw URL
          return value !== 'N/A' ? value : null;
        case 'engtl': // official english licensed URL
          return value !== 'N/A' ? value : null;
        default:
          return null;
      }
    };

    const officialSites = Object.entries(links)
      .map(([key, value]) => {
        const url = decodeLink(key, value);
        if (!url) return null;
        // Map key to readable name
        const nameMap = {
          al: 'Anilist',
          ap: 'Anime Planet',
          mu: 'Manga Updates',
          nu: 'Novel Updates',
          kt: 'Kitsu',
          amz: 'Amazon',
          ebj: 'Ebook Japan',
          mal: 'MyAnimeList',
          cdj: 'CDJapan',
          raw: 'Raw',
          engtl: 'English Licensed',
        };
        return { name: nameMap[key] || 'Official Site', url };
      })
      .filter(site => site !== null);

    const detailedManhwa = {
      id: manhwaId,
      cover,
      title: manga.attributes.title.en || 'No title available',
      author,
      artist,
      publishers,
      tags,
      associatedNames,
      status,
      summary,
      publishedYear,
      totalChapters,
      officialSites,
    };

    res.json(detailedManhwa);
  } catch (error) {
    console.error('Error fetching detailed manhwa:', error.message);
    res.status(500).json({ error: 'Failed to fetch detailed manhwa info' });
  }
});

// New API endpoint for searching manhwa by title
app.get('/api/search-manhwa', async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: 'Query parameter q is required' });
  }

  try {
    const response = await axios.get(`${MANGADEX_API_URL}/manga`, {
      params: {
        limit: 10,
        includes: ['cover_art'],
        contentRating: ['safe', 'suggestive', 'erotica', 'pornographic'],
        order: { relevance: 'desc' },
        'title': query,
      },
    });

    const results = response.data.data.map((manga) => {
      const coverRel = manga.relationships.find((rel) => rel.type === 'cover_art');
      return {
        id: manga.id,
        title: manga.attributes.title.en || 'No title available',
        cover: coverRel
          ? `https://uploads.mangadex.org/covers/${manga.id}/${coverRel.attributes.fileName}`
          : 'https://via.placeholder.com/150',
      };
    });

    res.json(results);
  } catch (error) {
    console.error('Error searching manhwa:', error.message);
    res.status(500).json({ error: 'Failed to search manhwa' });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
