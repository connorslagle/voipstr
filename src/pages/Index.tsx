import { useSeoMeta } from '@unhead/react';
import { Link } from 'react-router-dom';
import { Phone, MessageCircle, Users, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { VoipStatus } from '@/components/voip/VoipStatus';

const Index = () => {
  useSeoMeta({
    title: 'Nostr VOIP - Voice Calls over Nostr',
    description: 'Make secure voice calls over the Nostr network. WebRTC-powered VOIP with Nostr signaling.',
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <Phone className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Nostr VOIP
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Voice calls over Nostr
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <VoipStatus />
            <Link to="/voip">
              <Button>
                <Phone className="h-4 w-4 mr-2" />
                Open VOIP
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="mb-8">
            <div className="bg-blue-600 text-white inline-block p-3 rounded-full mb-6">
              <Phone className="h-12 w-12" />
            </div>
          </div>

          <h2 className="text-5xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Voice Calls Powered by Nostr
          </h2>

          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            Make secure, decentralized voice calls using WebRTC technology with Nostr for signaling.
            No central servers, no phone numbers required.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/voip">
              <Button size="lg" className="text-lg px-8 py-3">
                <Phone className="h-5 w-5 mr-2" />
                Start Calling
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="text-lg px-8 py-3">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white/50 dark:bg-gray-800/50">
        <div className="container mx-auto max-w-6xl">
          <h3 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-gray-100">
            Why Nostr VOIP?
          </h3>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <div className="bg-blue-100 dark:bg-blue-900/30 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Phone className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-lg">WebRTC Powered</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  High-quality voice calls using WebRTC with peer-to-peer connections for low latency.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="bg-green-100 dark:bg-green-900/30 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <MessageCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-lg">Nostr Signaling</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Decentralized signaling over the Nostr network. No central servers to block or monitor.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="bg-purple-100 dark:bg-purple-900/30 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle className="text-lg">Contact Based</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Call your Nostr contacts directly. No phone numbers needed, just pubkeys.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="bg-orange-100 dark:bg-orange-900/30 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Settings className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <CardTitle className="text-lg">Self-Hostable</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Run your own VOIP service. Perfect for Start9 servers and local network deployment.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Ready to Make Your First Call?</CardTitle>
              <CardDescription className="text-lg">
                Join the decentralized voice communication revolution today.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/voip">
                <Button size="lg" className="w-full sm:w-auto">
                  <Phone className="h-5 w-5 mr-2" />
                  Open VOIP Client
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm py-8 px-4">
        <div className="container mx-auto text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Built with ❤️ using Nostr and WebRTC. Vibed with{' '}
            <a
              href="https://soapbox.pub/mkstack"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline"
            >
              MKStack
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
