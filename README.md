# Gemini Voice Chat - Revolt Motors Replica

A real-time conversational voice interface using the Gemini Live API, replicating the functionality of the Revolt Motors voice chatbot.

## Features

- **Real-time Voice Chat**: Powered by Google's Gemini Live API
- **Voice Interruptions**: Seamlessly handle user interruptions during AI speech
- **Low Latency**: Optimized for 1-2 second response times
- **Server-to-Server Architecture**: Secure backend implementation with Node.js/Express
- **Clean Interface**: Modern UI inspired by Revolt Motors design

## Setup Instructions

### 1. Get Your Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/apikey)
2. Create a free API key
3. Keep it handy for the next steps

### 2. Install Dependencies

```bash
npm install
```

### 3. Start the Backend Server

```bash
npm run server
```

The backend will run on `http://localhost:3001`

### 4. Start the Frontend

In a new terminal:

```bash
npm run dev
```

The frontend will run on `http://localhost:8080`

### 5. Configure API Key

1. Open your browser and navigate to `http://localhost:8080`
2. Enter your Gemini API key in the setup form
3. Click "Start Voice Chat"

## Usage

1. **Grant Microphone Permission**: Allow microphone access when prompted
2. **Click to Talk**: Click the microphone button to start speaking
3. **Voice Interruption**: You can interrupt Rev while it's speaking
4. **Real-time Response**: Experience low-latency AI responses about Revolt Motors

## Technical Details

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express, Socket.IO
- **AI Model**: gemini-2.0-flash-live-001 (development) / gemini-2.5-flash-preview-native-audio-dialog (production)
- **Real-time Communication**: WebSocket via Socket.IO

## Development Notes

### Model Configuration

The app uses `gemini-2.0-flash-live-001` for development due to rate limits on the free tier. For production, switch to `gemini-2.5-flash-preview-native-audio-dialog` in the server.js file.

### Speech Processing

Currently uses a simulated speech-to-text conversion. For production implementation:

1. Integrate Google Speech-to-Text API
2. Add proper audio format conversion
3. Implement Text-to-Speech for AI responses

### System Instructions

Rev is configured to only discuss Revolt Motors products and services:
- Electric motorcycles (RV1, RV1+, RV BlazeX, RV400, RV400 BRZ)
- Features and specifications
- Test rides and dealerships
- Pricing and financing options

## Troubleshooting

### Server Connection Issues
- Ensure backend is running on port 3001
- Check CORS configuration if accessing from different origins

### API Key Issues
- Verify API key is valid at Google AI Studio
- Check API quotas and rate limits
- Ensure proper model permissions

### Audio Issues
- Grant microphone permissions in browser
- Check audio device settings
- Ensure WebRTC compatibility

## Architecture

```
Frontend (React + Socket.IO Client)
    ↓ WebSocket
Backend (Express + Socket.IO Server)
    ↓ HTTP API
Google Gemini Live API
```

The architecture follows server-to-server pattern for secure API key handling and optimal performance.

## License

This project is for educational and demonstration purposes, replicating the Revolt Motors voice chat functionality.