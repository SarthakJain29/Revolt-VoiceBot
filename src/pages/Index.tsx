import React, { useState, useEffect } from 'react';
import { VoiceChat } from '@/components/VoiceChat';
import { ApiKeySetup } from '@/components/ApiKeySetup';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [isApiConfigured, setIsApiConfigured] = useState(false);
  const [isCheckingApi, setIsCheckingApi] = useState(true);
  const { toast } = useToast();

  // Check if API is already configured
  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const response = await fetch('http://localhost:3001/api-status');
        const data = await response.json();
        setIsApiConfigured(data.configured);
      } catch (error) {
        console.error('Error checking API status:', error);
        toast({
          title: "Server Connection",
          description: "Make sure the backend server is running on port 3001",
          variant: "destructive"
        });
      } finally {
        setIsCheckingApi(false);
      }
    };

    checkApiStatus();
  }, [toast]);

  const handleApiKeySet = () => {
    setIsApiConfigured(true);
  };

  if (isCheckingApi) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking server connection...</p>
        </div>
      </div>
    );
  }

  if (!isApiConfigured) {
    return <ApiKeySetup onApiKeySet={handleApiKeySet} />;
  }

  return <VoiceChat />;
};

export default Index;
