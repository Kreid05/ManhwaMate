import React from 'react';
import './About.css';
import logo from '../assets/images/ManhwaMate Full logo (Black).png';
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaGithub, FaDiscord } from 'react-icons/fa';
import { SiX } from 'react-icons/si';

function About() {
  return (
    <div className="about-page-container">
      <div className="about-card">
        <img src={logo} alt="ManhwaMate Logo" className="about-logo" />
        <p className="about-description">
          ManhwaMate is a personalized recommendation app that helps users discover new manhwa titles based on their preferred genres. The app provides simple, AI-based recommendations, making it easier for users to explore stories they might enjoy.
        </p>
        <div className="about-footer">
          <div className="footer-year">2025</div>
          <div className="footer-developer">
            <strong>Developed By:</strong>
            Alcovendas, Limuel
          </div>
          <div className="footer-social-icons">
            <a href="https://www.facebook.com/insane1989" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <FaFacebookF />
            </a>
            <a href="https://x.com/lm_lcvnds" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)">
              <SiX />
            </a>
            <a href="https://www.instagram.com/limmmm.05/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <FaInstagram />
            </a>
            <a href="https://www.linkedin.com/in/lim-alcovendas-8175a3364/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              <FaLinkedinIn />
            </a>
            <a href="https://github.com/Kreid05" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
              <FaGithub />
            </a>
            <a href="https://discordapp.com/users/740433001858728038" target="_blank" rel="noopener noreferrer" aria-label="Discord">
              <FaDiscord />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default About;
