import { useSeoMeta } from '@unhead/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RelaySelector } from '@/components/RelaySelector';
import { useTheme } from '@/hooks/useTheme';
import { ArrowLeft, Sun, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BottomNavigation } from '@/components/BottomNavigation';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  
  useSeoMeta({
    title: 'Settings - Sleek',
    description: 'Configure your Sleek Messenger settings',
  });

  return (
    <>
      <div className="min-h-screen bg-background pb-20">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b border-border">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="mr-2 h-9 w-9"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-semibold text-foreground">Settings</h1>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Theme Toggle */}
          <Card>
            <CardContent className="p-6">
              <h2 className="font-medium mb-4">Appearance</h2>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {theme === 'dark' ? (
                    <Moon className="h-5 w-5" />
                  ) : (
                    <Sun className="h-5 w-5" />
                  )}
                  <span>Theme</span>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                >
                  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Relay Selector */}
          <Card>
            <CardContent className="p-6">
              <h2 className="font-medium mb-4">Network</h2>
              <div>
                <h3 className="text-sm font-medium mb-2">Relay</h3>
                <RelaySelector className="w-full" />
              </div>
            </CardContent>
          </Card>

          {/* Additional settings sections can be added here */}
        </div>
      </div>

      <BottomNavigation />
    </>
  );
}