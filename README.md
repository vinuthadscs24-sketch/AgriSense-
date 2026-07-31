# AgriSense Submission for the Synaptrix

## Problem Statement

**Chosen Domain:** AgriSense

**Problem Statement:**
Build an AI-powered farming assistant that helps farmers identify crop diseases, receive personalized agricultural advice, overcome language barriers, and make informed decisions to improve crop health and productivity.

---

# Team

**Team Name:** AgriOS

**Team Members:**

* Vinutha D S
* Sushmitha M G

---

# Our Solution

AgriSense is an AI-powered farming companion designed to assist farmers with instant crop health analysis and intelligent agricultural guidance. Farmers can upload an image of their crop to detect possible diseases using computer vision, receive AI-generated recommendations for treatment and prevention, and access responses in their preferred language through integrated translation. The platform combines modern AI technologies with a simple, user-friendly interface, making expert farming assistance more accessible to rural communities.

---

# AI Component

### What AI is used

* **Google Gemini API** – Generates intelligent farming recommendations and answers agricultural queries.
* **Plant Disease Detection Model** – Classifies crop diseases from uploaded leaf images using computer vision.
* **Translation Model/API** – Translates AI-generated responses into the farmer's preferred language.

### What it does in the app

* Detects crop diseases from uploaded images.
* Provides treatment and prevention recommendations based on the detected disease.
* Acts as an AI farming advisor for agricultural queries.
* Translates recommendations into multiple languages for better accessibility.

### Why we chose this approach

Google Gemini provides context-aware, natural language recommendations, making farming advice more useful and conversational. A dedicated disease detection model ensures accurate image-based diagnosis, while translation support makes the solution accessible to farmers who speak different regional languages.

---

# Tech Stack

### Frontend

* HTML
* CSS
* JavaScript

### Backend

* Python
* FastAPI

### AI / ML

* Google Gemini API
* Plant Disease Detection Model
* Computer Vision
* Prompt Engineering

### Database / Storage

* *(Add your database here if applicable, e.g., SQLite, PostgreSQL, Firebase, MongoDB, or "None")*

### Other Tools / APIs

* Git
* GitHub
* REST APIs
* Environment Variables (.env)

---

# Features Implemented

## Core Requirements

* AI-powered crop disease detection
* Intelligent farming advisor
* Crop health recommendations
* Multi-language translation support
* REST API backend using FastAPI
* User-friendly frontend for farmers

## Bonus Features Attempted

* AI-generated treatment suggestions
* Context-aware farming recommendations
* Modular backend architecture
* Scalable API design
* Easy integration for future enhancements

---

# How to Run This Project

```bash
# Clone the repository
git clone https://github.com/vinuthadscs24-sketch/AgriSense-.git

# Navigate into the project
cd AgriSense-

# Install backend dependencies
pip install -r requirements.txt

# Copy environment variables
cp .env.example .env

# Add your API keys to the .env file

# Start the backend server
python main.py
```

If your frontend is separate:

```bash
cd frontend

npm install

npm run dev
```

---

# API Keys / Environment Variables

This project uses environment variables to securely store API keys.

1. Create a `.env` file in the project root.
2. Copy the variables listed in `.env.example`.
3. Add your own API keys.
4. Ensure `.env` is included in `.gitignore`.
5. Never commit API keys to GitHub.

Example:

```env
GEMINI_API_KEY=your_api_key_here
TRANSLATION_API_KEY=your_api_key_here
```

---

# Screenshots

Include screenshots demonstrating:

* Home Page
* Crop Image Upload
* Disease Detection Result
* AI Farming Advisor
* Translation Feature

---

# Future Scope

* Weather forecasting integration
* Live market price prediction
* Voice-based farmer assistant
* Fertilizer recommendation system
* Government scheme suggestions
* IoT sensor integration
* Offline mode for rural areas

---

# Repository

GitHub Repository:
https://github.com/vinuthadscs24-sketch/AgriSense-

---

**Made with ❤️ to empower farmers through Artificial Intelligence.**
