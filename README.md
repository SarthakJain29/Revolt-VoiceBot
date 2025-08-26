# Voice Chat Bot with Gemini AI

A real-time voice chat application powered by Google's Gemini AI, built with React, Node.js, and Web Speech API.

## Features

- 🎤 **Real-time Voice Chat**: Speak naturally with the AI assistant
- 🧠 **Gemini AI Integration**: Powered by Google's latest AI model
- 🔊 **Text-to-Speech**: AI responses are spoken back to you
- 🎨 **Modern UI**: Beautiful, responsive interface with dark/light themes
- ⚡ **Real-time Communication**: WebSocket-based communication
- 🏍️ **Revolt Motors Assistant**: Specialized knowledge about electric motorcycles

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Google Gemini API key
- Modern browser with Web Speech API support (Chrome, Edge, Safari)

## Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd gemini-voice-replika
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up your Gemini API key**
   
   Environment variable (recommended)
   ```bash
   # Create a .env file in the root directory
   echo "GEMINI_API_KEY=your_api_key_here" > .env
   ```


4. **Start the application**
   ```bash
   # Start both frontend and backend servers
   npm run dev:full
   ```
   
   Or start them separately:
   ```bash
   # Terminal 1: Start backend server
   npm run server
   
   # Terminal 2: Start frontend development server
   npm run dev
   ```

5. **Open your browser**
   - Navigate to `http://localhost:8081` (or the port shown in your terminal)
   - Allow microphone permissions when prompted
   - Click the microphone button to start talking!

## Troubleshooting

### Common Issues

1. **"Microphone Access Required"**
   - Make sure you've allowed microphone permissions in your browser
   - Refresh the page and try again

2. **"Browser Not Supported"**
   - Use Chrome, Edge, or Safari for best compatibility
   - Ensure you're using a modern browser version

3. **"Server Connection" Error**
   - Make sure the backend server is running on port 3001
   - Check that no other application is using the same port

4. **"API key not configured"**
   - Set your Gemini API key via environment variable or UI
   - Ensure the API key is valid and has proper permissions

5. **Speech Recognition Not Working**
   - Check that your microphone is working and not muted
   - Try speaking more clearly and slowly
   - Ensure you're in a quiet environment

### API Key Setup

To get a Gemini API key:
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key and add it to your `.env` file or use the UI setup


## Technologies Used

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js, Express, Socket.IO
- **AI**: Google Gemini API
- **Voice**: Web Speech API (Speech Recognition & Synthesis)
- **UI**: Shadcn/ui components

## Development

### Available Scripts

- `npm run dev:full` - Start both frontend and backend
- `npm run dev` - Start frontend only
- `npm run server` - Start backend only
- `npm run build` - Build for production
- `npm run lint` - Run ESLint

##Made With ❤️ By Sarthak Jain
