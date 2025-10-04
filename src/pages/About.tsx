import { useSeoMeta } from '@unhead/react';
import { MessageCircle, Shield, Zap, Globe, Lock, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const About = () => {
  useSeoMeta({
    title: 'About - Sleek',
    description: 'Learn more about Sleek, a modern, private messaging app built on the Nostr protocol.',
  });

  return (
    <>
      <div className="min-h-screen bg-background pb-24">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b border-border">
          <div className="p-4">
            <h1 className="text-xl font-semibold text-foreground">About Sleek</h1>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          {/* Hero Section */}
          <div className="text-center py-8">
            <MessageCircle className="h-20 w-20 text-primary mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Sleek Messenger
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A modern, private messaging app built on the Nostr protocol. 
              Connect with anyone, anywhere, without compromising your privacy.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  End-to-End Encrypted
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Your conversations are encrypted using NIP-44 encryption. 
                  Only you and your recipient can read your messages.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  Decentralized Network
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Built on Nostr, a truly decentralized protocol with no central 
                  authority or single point of failure.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Censorship Resistant
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  No one can shut down or censor your communications. 
                  Your messages are distributed across multiple relays.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Own Your Identity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Your identity is based on cryptographic keys, not phone numbers 
                  or email addresses. You truly own your account.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Lightning Fast
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Real-time messaging with instant delivery. Built with modern 
                  technologies for a smooth, responsive experience.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  Open Source
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Fully open source and transparent. Audit the code yourself 
                  or contribute to make it even better.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* What is Nostr Section */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-2xl">What is Nostr?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Nostr (Notes and Other Stuff Transmitted by Relays) is a simple, 
                open protocol that enables truly censorship-resistant and global 
                social networks. It's the foundation that powers Sleek Messenger.
              </p>
              <p className="text-muted-foreground">
                Unlike traditional messaging apps that rely on a central server, 
                Nostr uses a network of relays to distribute your messages. This 
                means no single company or government can shut down or control 
                your communications.
              </p>
              <p className="text-muted-foreground">
                Your identity on Nostr is a cryptographic key pair. This key pair 
                works across all Nostr apps, so you can use the same identity 
                for messaging, social media, and more.
              </p>
            </CardContent>
          </Card>

          {/* Technology Stack */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Built With Modern Tech</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Sleek is built with cutting-edge web technologies to provide 
                a fast, reliable, and beautiful experience:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span><strong>React 18</strong> - Modern UI framework with hooks and concurrent rendering</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span><strong>Nostrify</strong> - Powerful Nostr protocol framework</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span><strong>TailwindCSS</strong> - Beautiful, responsive design</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span><strong>Vite</strong> - Lightning-fast development and builds</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span><strong>TypeScript</strong> - Type-safe, maintainable code</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Footer Attribution */}
          <div className="text-center py-6 text-sm text-muted-foreground">
            <p>
              Vibed with{' '}
              <a 
                href="https://soapbox.pub/mkstack" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                MKStack
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default About;
