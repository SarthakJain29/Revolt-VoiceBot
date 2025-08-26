import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Eye, EyeOff, ExternalLink } from 'lucide-react';

interface ApiKeySetupProps {
  onApiKeySet: () => void;
}

export const ApiKeySetup: React.FC<ApiKeySetupProps> = ({ onApiKeySet }) => {
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter your Gemini API key",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3001/set-api-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success!",
          description: "API key configured successfully. Starting voice chat...",
        });
        onApiKeySet();
      } else {
        toast({
          title: "Configuration Failed",
          description: data.error || "Failed to configure API key",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error setting API key:', error);
      toast({
        title: "Connection Error",
        description: "Could not connect to server. Make sure the backend is running.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-background via-background to-primary/5">
      <Card className="w-full max-w-md shadow-elegant glass-card">
        <CardHeader className="text-center relative">
          <div className="absolute top-4 right-4">
            <ThemeToggle />
          </div>
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-primary-glow flex items-center justify-center shadow-glow animate-float">
              <span className="text-primary-foreground font-bold">R</span>
            </div>
            <CardTitle className="text-2xl gradient-text">Talk to Rev</CardTitle>
          </div>
          <CardDescription className="text-muted-foreground">
            Configure your Gemini API key to start the voice chat experience
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">Gemini API Key</Label>
              <div className="relative">
                <Input
                  id="apiKey"
                  type={showApiKey ? "text" : "password"}
                  placeholder="Enter your Gemini API key..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                type="submit"
                className="w-full hover-lift button-glow"
                disabled={isLoading}
              >
                {isLoading ? "Configuring..." : "Start Voice Chat"}
              </Button>

              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={() => window.open('https://aistudio.google.com/apikey', '_blank')}
                  className="text-xs"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Get API Key from Google AI Studio
                </Button>
              </div>
            </div>
          </form>

          <div className="mt-6 p-4 bg-muted rounded-lg text-sm text-muted-foreground">
            <h4 className="font-medium mb-2">Setup Instructions:</h4>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Visit Google AI Studio (link above)</li>
              <li>Create a free API key</li>
              <li>Paste it above to start chatting with Rev</li>
              <li>Make sure your backend server is running on port 3001</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};