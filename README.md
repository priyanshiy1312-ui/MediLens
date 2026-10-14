# MediLens — See Healthcare More Clearly

MediLens is an AI-powered healthcare discovery and comparison platform that helps users find, understand, and compare healthcare providers using live search and patient review data.

## 🚀 What MediLens Does

MediLens combines live healthcare discovery with review intelligence and transparent provider comparison.

### Core Features

- 🔎 Natural-language healthcare search
- 📍 Live healthcare provider discovery
- ⭐ Provider ratings and review counts
- 📞 Address and contact information
- 🕒 Opening status when available
- 📝 Patient review retrieval
- 🔍 Search within patient reviews
- 📊 Provider comparison
- 🧠 AI-powered review insights
- 📈 Transparent MediLens Score
- 💡 Evidence-based explanations
- 🔐 Secure server-side API key handling

## 🧩 How It Works

1. User searches for a healthcare provider or service.
2. MediLens sends the query to the backend.
3. The backend uses SerpApi to retrieve live healthcare data.
4. Provider information is displayed using the actual returned data.
5. Patient reviews can be retrieved for individual providers.
6. Users can search reviews for topics such as waiting time or service experience.
7. Providers can be compared using available public signals.

## 🛠️ Tech Stack

- Node.js
- Express.js
- JavaScript
- HTML
- CSS
- SerpApi
- Google Maps Search
- Google Maps Reviews

## 🔑 Environment Variables

Create a `.env` file in the project root:

```env
SERPAPI_API_KEY=your_serpapi_api_key
