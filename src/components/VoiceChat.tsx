import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import io, { Socket } from 'socket.io-client';

type VoiceState = 'idle' | 'connecting' | 'listening' | 'processing' | 'speaking' | 'error';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

export const VoiceChat: React.FC = () => {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [messages, setMessages] = useState<Message[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io('http://localhost:3001', {
      transports: ['websocket']
    });

    newSocket.on('connect', () => {
      console.log('Connected to server');
      setVoiceState('idle');
    });

    newSocket.on('ai_response', (data: { text: string, audio?: ArrayBuffer }) => {
      const message: Message = {
        id: Date.now().toString(),
        type: 'ai',
        content: data.text,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, message]);
      setVoiceState('speaking');

      // Play audio response if available
      if (data.audio) {
        playAudioResponse(data.audio);
      } else {
        setVoiceState('idle');
      }
    });

    newSocket.on('error', (error: string) => {
      console.error('Socket error:', error);
      setVoiceState('error');
      toast({
        title: "Connection Error",
        description: error,
        variant: "destructive"
      });
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setVoiceState('idle');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [toast]);

  // Request microphone permission
  useEffect(() => {
    const requestPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setHasPermission(true);
        stream.getTracks().forEach(track => track.stop());
      } catch (error) {
        console.error('Microphone permission denied:', error);
        setHasPermission(false);
        toast({
          title: "Microphone Access Required",
          description: "Please allow microphone access to use voice chat",
          variant: "destructive"
        });
      }
    };

    requestPermission();
  }, [toast]);

  const playAudioResponse = async (audioBuffer: ArrayBuffer) => {
    try {
      const audioContext = new AudioContext();
      const audioData = await audioContext.decodeAudioData(audioBuffer);
      const source = audioContext.createBufferSource();
      
      source.buffer = audioData;
      source.connect(audioContext.destination);
      
      source.onended = () => {
        setVoiceState('idle');
      };
      
      source.start();
    } catch (error) {
      console.error('Error playing audio:', error);
      setVoiceState('idle');
    }
  };

  const startRecording = async () => {
    if (!hasPermission || !socket) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
        sendAudioToServer(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start(100); // Collect data every 100ms
      setMediaRecorder(recorder);
      setVoiceState('listening');

    } catch (error) {
      console.error('Error starting recording:', error);
      setVoiceState('error');
      toast({
        title: "Recording Error",
        description: "Failed to start recording",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && voiceState === 'listening') {
      mediaRecorder.stop();
      setVoiceState('processing');
    }
  };

  const sendAudioToServer = async (audioBlob: Blob) => {
    if (!socket) return;

    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      
      // Add user message to chat
      const userMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        content: 'Voice message',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);

      // Send audio to server
      socket.emit('audio_message', {
        audio: arrayBuffer,
        mimeType: 'audio/webm;codecs=opus'
      });

    } catch (error) {
      console.error('Error sending audio:', error);
      setVoiceState('error');
      toast({
        title: "Send Error",
        description: "Failed to send audio message",
        variant: "destructive"
      });
    }
  };

  const handleVoiceAction = () => {
    if (voiceState === 'idle') {
      startRecording();
    } else if (voiceState === 'listening') {
      stopRecording();
    }
  };

  const getButtonVariant = () => {
    switch (voiceState) {
      case 'listening': return 'voice-listening';
      case 'processing': return 'voice-processing';
      case 'speaking': return 'voice-speaking';
      case 'error': return 'destructive';
      default: return 'voice';
    }
  };

  const getStatusText = () => {
    switch (voiceState) {
      case 'connecting': return 'Connecting...';
      case 'listening': return 'Listening... (click to stop)';
      case 'processing': return 'Processing...';
      case 'speaking': return 'Rev is speaking...';
      case 'error': return 'Error - Please try again';
      default: return 'Click to talk to Rev';
    }
  };

  if (hasPermission === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <Card className="p-8 text-center max-w-md">
          <MicOff className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Microphone Access Required</h2>
          <p className="text-muted-foreground mb-4">
            To use voice chat with Rev, please allow microphone access and refresh the page.
          </p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-center p-6 border-b">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
            <span className="text-accent-foreground font-bold text-sm">R</span>
          </div>
          <h1 className="text-2xl font-bold">Talk to Rev</h1>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <Card className={`p-3 max-w-xs ${
                message.type === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted'
              }`}>
                <p className="text-sm">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* Voice Interface */}
      <div className="p-6 border-t">
        <div className="max-w-md mx-auto text-center">
          <div className="mb-4">
            <Button
              size="lg"
              variant={getButtonVariant()}
              onClick={handleVoiceAction}
              disabled={voiceState === 'processing' || voiceState === 'speaking' || voiceState === 'connecting'}
              className="w-20 h-20 rounded-full"
            >
              {voiceState === 'processing' || voiceState === 'connecting' ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : voiceState === 'listening' ? (
                <Mic className="w-8 h-8" />
              ) : (
                <Mic className="w-8 h-8" />
              )}
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground">
            {getStatusText()}
          </p>
        </div>
      </div>
    </div>
  );
};