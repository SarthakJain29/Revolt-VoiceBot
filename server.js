import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from "dotenv";

dotenv.config();
const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  'http://localhost:8080', 
  'http://127.0.0.1:8080',
  'http://localhost:8081',
  'http://127.0.0.1:8081',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST'],
  credentials: true
}));

const io = new SocketIOServer(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.use(express.json());

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    server: 'voice-chat-server'
  });
});

// System instructions for Revolt Motors
const SYSTEM_INSTRUCTION = `
You are Rev, the friendly AI assistant for Revolt Motors. You are knowledgeable about:

1. Revolt Electric Motorcycles:
   - RV1 and RV1+ (entry-level electric bikes)
   - RV BlazeX (premium model)
   - RV400 and RV400 BRZ (flagship models)

2. Key Features:
   - AI-enabled smart features
   - Revolutionary charging technology
   - Sustainable electric mobility
   - Made in India electric bikes
   - Competitive pricing with benefits up to ₹20,000

3. Services:
   - Test rides available
   - Dealership locations across India
   - Customer support and service
   - Financing options
   - Insurance support

4. Company Values:
   - Sustainability and eco-friendliness
   - Innovation in electric mobility
   - Making electric bikes accessible
   - Indian manufacturing and technology

Keep responses concise, friendly, and focused on Revolt Motors. If asked about competitors or unrelated topics, politely redirect to Revolt products and services. Always be helpful in guiding customers toward test rides, bookings, or finding nearby dealerships.
`;

let genAI;
let model;

// Initialize Gemini AI
function initializeAI(apiKey) {
  try {
    genAI = new GoogleGenerativeAI(apiKey);
    
    model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash-preview-native-audio-dialog",
      systemInstruction: SYSTEM_INSTRUCTION,
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 150,
      }
    });
    
    console.log('Gemini AI initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing Gemini AI:', error);
    return false;
  }
}

// Store API key (in production, use environment variables)
let GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Endpoint to set API key
app.post('/set-api-key', (req, res) => {
  const { apiKey } = req.body;
  
  if (!apiKey) {
    return res.status(400).json({ error: 'API key is required' });
  }
  
  GEMINI_API_KEY = apiKey;
  const success = initializeAI(apiKey);
  
  if (success) {
    res.json({ success: true, message: 'API key set successfully' });
  } else {
    res.status(500).json({ error: 'Failed to initialize AI with provided key' });
  }
});

// Check if API key is configured
app.get('/api-status', (req, res) => {
  console.log('API status check - API key:', !!GEMINI_API_KEY, 'Model:', !!model);
  res.json({ 
    configured: !!GEMINI_API_KEY && !!model,
    message: GEMINI_API_KEY ? 'API key configured' : 'API key required',
    server: 'running'
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('audio_message', async (data) => {
    try {
      if (!model) {
        socket.emit('ai_error', 'Gemini AI not initialized. Please configure API key.');
        return;
      }

      const { transcription } = data;
      if (!transcription || typeof transcription !== 'string') {
        socket.emit('ai_error', 'No transcription received from client.');
        return;
      }

      console.log(`[${socket.id}] Received transcription (${transcription.length} chars):`, transcription);

      // Add a small delay to prevent rapid-fire responses
      await new Promise(resolve => setTimeout(resolve, 200));

      // Generate AI response
      const result = await model.generateContent(transcription);
      const response = result.response.text();
      
      console.log(`[${socket.id}] AI Response (${response.length} chars)`);

      // Send response back to client
      socket.emit('ai_response', {
        text: response,
        transcription
      });

    } catch (error) {
      console.error('Error processing audio message:', error);
      const message = (error && error.message) ? error.message : 'Failed to process your message. Please try again.';
      socket.emit('ai_error', message);
    }
  });

  socket.on('text_message', async (data) => {
    try {
      if (!model) {
        socket.emit('ai_error', 'Gemini AI not initialized. Please configure API key.');
        return;
      }

      const { message } = data;
      console.log('Text message:', message);

      const result = await model.generateContent(message);
      const response = result.response.text();
      
      console.log('AI Response:', response);

      socket.emit('ai_response', { text: response });

    } catch (error) {
      console.error('Error processing text message:', error);
      const msg = (error && error.message) ? error.message : 'Failed to process your message. Please try again.';
      socket.emit('ai_error', msg);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Initialize AI if API key is provided via environment
if (GEMINI_API_KEY) {
  initializeAI(GEMINI_API_KEY);
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Voice chat server running on port ${PORT}`);
  console.log(`🌐 WebSocket endpoint: ws://localhost:${PORT}`);
  console.log(`📡 API endpoint: http://localhost:${PORT}/api-status`);
  console.log(`🔗 Allowed CORS origins:`, allowedOrigins);
  
  if (!GEMINI_API_KEY) {
    console.log('⚠️  Gemini API key not configured. Set GEMINI_API_KEY environment variable or use /set-api-key endpoint');
  } else {
    console.log('✅ Gemini API key is configured');
  }
});

export default app;