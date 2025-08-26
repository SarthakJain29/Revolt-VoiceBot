# Server Setup Instructions

## Quick Start

To run the complete Gemini Voice Chat application:

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Backend Server
In your terminal, run:
```bash
node server.js
```

The server will start on port 3001. You should see:
```
Voice chat server running on port 3001
WebSocket endpoint: ws://localhost:3001
⚠️  Gemini API key not configured. Set GEMINI_API_KEY environment variable or use /set-api-key endpoint
```

### 3. Start Frontend
In a **new terminal window**:
```bash
npm run dev
```

The frontend will start on port 8080.

### 4. Configure API Key
1. Visit http://localhost:8080
2. Get your API key from https://aistudio.google.com/apikey
3. Enter the API key in the setup form
4. Start chatting with Rev!

## Environment Setup (Alternative)

Instead of using the UI, you can set the API key as an environment variable:

```bash
export GEMINI_API_KEY="your_api_key_here"
node server.js
```

## Troubleshooting

- **Port 3001 in use**: Change the PORT in server.js
- **CORS issues**: Check the CORS configuration in server.js
- **API key errors**: Verify your key at Google AI Studio
- **Microphone issues**: Grant permissions in your browser

## Production Notes

- For production, replace the model in server.js with `gemini-2.5-flash-preview-native-audio-dialog`
- Implement proper Speech-to-Text and Text-to-Speech APIs
- Add authentication and rate limiting
- Use environment variables for configuration