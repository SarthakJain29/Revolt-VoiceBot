import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/ThemeToggle';
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
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesis | null>(null);
  const [isConversationMode, setIsConversationMode] = useState<boolean>(false);
  
  const audioChunksRef = useRef<Blob[]>([]);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const processingTimeoutRef = useRef<number | null>(null);
  const isConversationModeRef = useRef<boolean>(false);
  const voiceStateRef = useRef<VoiceState>('idle');
  const socketRef = useRef<Socket | null>(null);
  const { toast } = useToast();

  // Keep refs in sync with state
  useEffect(() => { isConversationModeRef.current = isConversationMode; }, [isConversationMode]);
  useEffect(() => { voiceStateRef.current = voiceState; }, [voiceState]);

  // Initialize speech recognition and synthesis (run once)
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognitionCtor();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';
      
      recognitionInstance.onresult = (event) => {
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          }
        }
        
        if (finalTranscript.trim()) {
          const userMessage: Message = {
            id: Date.now().toString(),
            type: 'user',
            content: finalTranscript,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, userMessage]);
          
          const s = socketRef.current;
          if (s) {
            setVoiceState('processing');
            if (processingTimeoutRef.current) window.clearTimeout(processingTimeoutRef.current);
            processingTimeoutRef.current = window.setTimeout(() => {
              setVoiceState('error');
              toast({
                title: 'Timeout',
                description: 'Taking too long to respond. Please try again.',
                variant: 'destructive'
              });
              if (isConversationModeRef.current && recognition) {
                try { recognition.start(); } catch {}
              }
            }, 10000);

            s.emit('audio_message', { transcription: finalTranscript });
          }
        }
      };
      
      recognitionInstance.onerror = (event) => {
        const err: any = event as any;
        if (err.error !== 'no-speech') {
          setVoiceState('error');
          toast({
            title: "Speech Recognition Error",
            description: "Could not understand your speech. Please try again.",
            variant: "destructive"
          });
        }
      };
      
      recognitionInstance.onend = () => {
        if (isConversationModeRef.current && voiceStateRef.current !== 'speaking') {
          try { recognitionInstance.start(); } catch {}
        }
      };
      
      recognitionInstance.onstart = () => {
        setVoiceState('listening');
      };
      
      setRecognition(recognitionInstance);
    }
    
    if ('speechSynthesis' in window) {
      setSpeechSynthesis(window.speechSynthesis);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialize socket connection (run once)
  useEffect(() => {
    const newSocket = io('http://localhost:3001', {
      transports: ['websocket']
    });

    newSocket.on('connect', () => {
      socketRef.current = newSocket;
      setVoiceState('idle');
    });

    newSocket.on('ai_response', (data: { text: string, transcription?: string }) => {
      if (processingTimeoutRef.current) {
        window.clearTimeout(processingTimeoutRef.current);
        processingTimeoutRef.current = null;
      }

      const message: Message = {
        id: Date.now().toString(),
        type: 'ai',
        content: data.text,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, message]);
      setVoiceState('speaking');
      speakResponse(data.text);
    });

    newSocket.on('ai_error', (error: string) => {
      if (processingTimeoutRef.current) {
        window.clearTimeout(processingTimeoutRef.current);
        processingTimeoutRef.current = null;
      }
      setVoiceState('error');
      toast({ title: 'AI Error', description: error, variant: 'destructive' });
      if (isConversationModeRef.current && recognition) {
        try { recognition.start(); } catch {}
      }
    });

    newSocket.on('error', (error: string) => {
      setVoiceState('error');
      toast({ title: 'Connection Error', description: error, variant: 'destructive' });
    });

    newSocket.on('disconnect', () => {
      socketRef.current = null;
      setVoiceState('idle');
    });

    setSocket(newSocket);
    socketRef.current = newSocket;
    return () => { newSocket.close(); socketRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Request microphone permission (run once)
  useEffect(() => {
    const requestPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setHasPermission(true);
        stream.getTracks().forEach(track => track.stop());
      } catch (error) {
        setHasPermission(false);
        toast({ title: 'Microphone Access Required', description: 'Please allow microphone access to use voice chat', variant: 'destructive' });
      }
    };
    requestPermission();
  }, [toast]);

  const speakResponse = (text: string) => {
    if (!speechSynthesis) {
      setVoiceState('idle');
      return;
    }

    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    utterance.onend = () => {
      setVoiceState('idle');
      if (isConversationModeRef.current && recognition) {
        try { recognition.start(); } catch {}
      }
    };
    
    utterance.onerror = () => {
      setVoiceState('idle');
    };
    
    speechSynthesis.speak(utterance);
  };

  const startConversation = async () => {
    if (!hasPermission || !recognition) return;

    try {
      setIsConversationMode(true);
      setVoiceState('listening');
      recognition.start();
    } catch (error) {
      setVoiceState('error');
      toast({ title: 'Recording Error', description: 'Failed to start recording', variant: 'destructive' });
    }
  };

  const stopConversation = () => {
    if (recognition) {
      recognition.stop();
    }
    setIsConversationMode(false);
    setVoiceState('idle');
    
    if (speechSynthesis) {
      speechSynthesis.cancel();
    }
    if (processingTimeoutRef.current) {
      window.clearTimeout(processingTimeoutRef.current);
      processingTimeoutRef.current = null;
    }
  };

  const handleVoiceAction = () => {
    if (voiceState === 'idle') {
      startConversation();
    } else {
      stopConversation();
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
      case 'listening': return 'Listening...';
      case 'processing': return 'Thinking...';
      case 'speaking': return 'Responding...';
      case 'error': return 'Error - Tap mic to retry';
      default: return 'Tap the mic and start talking to Rev';
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

  if (!recognition) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <Card className="p-8 text-center max-w-md">
          <MicOff className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Browser Not Supported</h2>
          <p className="text-muted-foreground mb-4">
            Your browser doesn't support speech recognition. Please use Chrome, Edge, or Safari.
          </p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-background to-primary/5">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <div className="w-15 h-15 flex items-center justify-center shadow-glow">
            <img 
              src="https://live.revoltmotors.com/images/Rev.gif" 
              alt="Logo"  />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Talk to Rev</h1>
            <p className="text-xs text-muted-foreground">Your Revolt Motors voice assistant</p>
          </div>
        </div>
        <ThemeToggle />
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <Card className={`p-3 px-4 max-w-[80%] ${
                message.type === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-card'
              }`}>
                <p className="text-sm leading-relaxed">{message.content}</p>
                <p className="text-[10px] opacity-70 mt-1 text-right">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* Voice Interface */}
      <div className="p-6 border-t sticky bottom-0 bg-background/60 backdrop-blur">
        <div className="max-w-md mx-auto text-center">
          <div className="mb-3">
            <Button
              size="lg"
              variant={getButtonVariant()}
              onClick={handleVoiceAction}
              disabled={voiceState === 'processing' || voiceState === 'connecting'}
              className="w-24 h-24 rounded-full button-glow hover-lift animate-pulse-glow shadow-[0_10px_40px_hsl(var(--ring)/0.25)]"
            >
              {voiceState === 'processing' || voiceState === 'connecting' ? (
                <Loader2 className="w-9 h-9 animate-spin" />
              ) : (
                <Mic className="w-9 h-9" />
              )}
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground">
            {getStatusText()}
          </p>
          
          {isConversationMode && (
            <p className="text-xs text-green-600 mt-2">
              Tap mic to stop.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};