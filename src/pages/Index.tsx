import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getCurrentThaiDate } from "@/lib/date-utils";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white py-20">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">🌾 RaiAI</h1>
          <p className="text-xl md:text-2xl mb-4">Smart Farming Assistant for Thailand</p>
          <p className="text-lg md:text-xl mb-8 opacity-90">
            AI-powered crop diagnosis • Real-time prices • Shop integration
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-white text-green-600 hover:bg-gray-100 text-lg px-8 py-3"
              onClick={() => window.location.href = '/rai-ai'}
            >
              📱 Download Mobile App
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white text-white hover:bg-white hover:text-green-600 text-lg px-8 py-3"
              onClick={() => window.location.href = '/counter'}
            >
              🏪 Shop Counter
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Key Features</h2>
            <p className="text-xl text-gray-600">Everything you need for smart farming in Thailand</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="text-5xl mb-4">🔍</div>
                <CardTitle className="text-xl">AI Crop Diagnosis</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">
                  Upload photos to get instant disease detection and treatment recommendations for rice and durian crops.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="text-5xl mb-4">📊</div>
                <CardTitle className="text-xl">Real-time Prices</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">
                  Track market prices across Thailand with live updates and price alerts for your crops.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="text-5xl mb-4">🎫</div>
                <CardTitle className="text-xl">Digital Shop Tickets</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">
                  Generate QR tickets for agri-shops to scan and recommend the right products for your farm.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="text-5xl mb-4">🚨</div>
                <CardTitle className="text-xl">Outbreak Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">
                  Get hyperlocal disease warnings within 3km of your farm with instant notifications.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="text-5xl mb-4">📱</div>
                <CardTitle className="text-xl">Offline Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">
                  Works without internet connection. Sync when you're back online.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="text-5xl mb-4">🤝</div>
                <CardTitle className="text-xl">Referral System</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">
                  Earn rewards by bringing neighbors to the platform and get discounts at partner shops.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* API Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">API & Integration</h2>
            <p className="text-xl text-gray-600">For developers, agri-shops, and partners</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">📈</span>
                  Price API
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-3">Real-time crop prices and market data</p>
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">GET /api/prices/current</code>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">🏪</span>
                  Shop Tickets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-3">Digital ticket system for agri-shops</p>
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">POST /api/shop-tickets/scan</code>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">📊</span>
                  Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-3">Usage analytics and KPIs</p>
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">GET /api/analytics/kpis</code>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">🚩</span>
                  Feature Flags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-3">Dynamic feature management</p>
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">GET /api/feature-flags</code>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-teal-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">📱</span>
                  Offline Cache
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-3">Offline data synchronization</p>
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">GET /api/cache/sync</code>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">🔧</span>
                  Build Info
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-3">System status and version info</p>
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">GET /api/build/info</code>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Button 
              size="lg" 
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => window.location.href = '/api/health'}
            >
              🔍 API Health Check
            </Button>
            <Badge variant="default" className="ml-4">LIVE</Badge>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Get Started</h2>
            <p className="text-lg text-gray-600">Choose your path to smart farming</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Button 
              className="h-24 flex flex-col gap-2 w-full text-lg"
              onClick={() => window.location.href = '/rai-ai'}
            >
              <span className="text-3xl">🌤️</span>
              <span>Weather Check</span>
            </Button>
            <Button 
              className="h-24 flex flex-col gap-2 w-full text-lg" 
              variant="outline"
              onClick={() => window.location.href = '/rai-ai?view=scan'}
            >
              <span className="text-3xl">📱</span>
              <span>Scan Disease</span>
            </Button>
            <Button 
              className="h-24 flex flex-col gap-2 w-full text-lg" 
              variant="outline"
              onClick={() => window.location.href = '/rai-ai?view=fields'}
            >
              <span className="text-3xl">📊</span>
              <span>View Fields</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-lg mb-4">&copy; 2024 RaiAI. All rights reserved.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm">
            <a href="/about" className="text-blue-400 hover:text-blue-300">
              About Us
            </a>
            <Separator orientation="vertical" className="hidden sm:block" />
            <a href="/contact" className="text-blue-400 hover:text-blue-300">
              Contact
            </a>
            <Separator orientation="vertical" className="hidden sm:block" />
            <a href="/privacy" className="text-blue-400 hover:text-blue-300">
              Privacy
            </a>
            <Separator orientation="vertical" className="hidden sm:block" />
            <a href="/terms" className="text-blue-400 hover:text-blue-300">
              Terms
            </a>
            <Separator orientation="vertical" className="hidden sm:block" />
            <a href="mailto:support@raiai.app" className="text-blue-400 hover:text-blue-300">
              support@raiai.app
            </a>
            <Separator orientation="vertical" className="hidden sm:block" />
            <a href="/api/health" className="text-blue-400 hover:text-blue-300">
              API Status
            </a>
            <Separator orientation="vertical" className="hidden sm:block" />
            <a href="/counter" className="text-blue-400 hover:text-blue-300">
              Shop Counter
            </a>
          </div>
          <p className="text-sm text-gray-400 mt-4">{getCurrentThaiDate()}</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
