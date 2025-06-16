import React, { useState } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import './Recommendation.css';
import surpriseMeImage from '../assets/images/surprise me white.png';

function Recommendation() {
  const [messages, setMessages] = useState([
    { text: 'Hello! How can I help you find your next favorite manhwa or manga?', sender: 'bot' },
  ]);
  const [userInput, setUserInput] = useState('');
  const [isSurprised, setIsSurprised] = useState(false);
  const [surpriseTitle, setSurpriseTitle] = useState('');
  const [randomManhwa, setRandomManhwa] = useState(null);

  const handleSendMessage = async () => {
    if (userInput.trim() === '') return;

    const newUserMessage = { text: userInput, sender: 'user' };
    setMessages((prev) => [...prev, newUserMessage]);
    setUserInput('');

    try {
      // Prepend instruction to restrict chatbot content to Manhwa/Manga/Manhua topics only
      const prompt = "You are a helpful chatbot that only talks about Manhwa, Manga, and Manhua. Please only respond about these topics. User: " + userInput;

      const response = await axios.post('http://localhost:5000/api/chatbot', { message: prompt });
      const botResponse = {
        text: response.data.reply,
        sender: 'bot',
      };
      setMessages((prev) => [...prev, botResponse]);
    } catch (error) {
      const errorResponse = {
        text: 'Sorry, there was an error processing your request.',
        sender: 'bot',
      };
      setMessages((prev) => [...prev, errorResponse]);
    }
  };

  const handleSurpriseClick = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/random-manhwa');
      const data = response.data;
      setSurpriseTitle(data.title);
      setIsSurprised(true);
      setRandomManhwa(data);
    } catch (error) {
      console.error('Error fetching surprise manhwa:', error.message);
    }
  };

  return (
    <div className="recommendation-page">
      <div className="surprise-cover" onClick={handleSurpriseClick}>
        {!isSurprised ? (
          <img src={surpriseMeImage} alt="Surprise Me" className="surprise-image" />
        ) : (
          randomManhwa && (
            <div className="surprise-card">
              <img
                src={randomManhwa.cover}
                alt="Manhwa Cover"
                className="surprise-card-image"
              />
              <h2 className="surprise-card-title">{randomManhwa.title}</h2>
              <p className="surprise-card-summary">{randomManhwa.summary}</p>

              <div className="surprise-card-meta">
                <p><strong>Author:</strong> {randomManhwa.author}</p>
                <p><strong>Artist/s:</strong> {randomManhwa.artist}</p>
                <p><strong>Published Year:</strong> {randomManhwa.year}</p>
              </div>
            </div>
          )
        )}
      </div>

      <div className="chat-section">
        <div className="chat-title">ChatRECO</div>
        <div className="chatbox">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`chat-message ${msg.sender === 'bot' ? 'bot-message' : 'user-message'}`}
            >
              <ReactMarkdown>{msg.text}</ReactMarkdown>
            </div>
          ))}
        </div>
        <div className="chat-input-container">
          <input
            type="text"
            className="chat-input"
            placeholder="Write something..."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <button className="send-button" onClick={handleSendMessage}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default Recommendation;
