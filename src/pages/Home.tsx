export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white py-20">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">🌾 RaiAI</h1>
          <p className="text-xl md:text-2xl mb-4">Farming Assistant for Thailand</p>
          <p className="text-lg md:text-xl mb-8 opacity-90">
            Scan crops, get advice, and track prices
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/rai-ai" 
              className="bg-white text-green-600 hover:bg-gray-100 text-lg px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              📱 Download Mobile App
            </a>
            <a 
              href="/counter" 
              className="border-2 border-white text-white hover:bg-white hover:text-green-600 text-lg px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              🏪 Shop Counter
            </a>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Key Features</h2>
            <p className="text-xl text-gray-600">Everything you need for smart farming in Thailand</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center p-6 border rounded-lg hover:shadow-lg transition-shadow">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold mb-2">AI Crop Diagnosis</h3>
              <p className="text-gray-600">
                Upload photos to get instant disease detection and treatment recommendations for rice and durian crops.
              </p>
            </div>

            <div className="text-center p-6 border rounded-lg hover:shadow-lg transition-shadow">
              <div className="text-5xl mb-4">📊</div>
              <h3 className="text-xl font-semibold mb-2">Real-time Prices</h3>
              <p className="text-gray-600">
                Track market prices across Thailand with live updates and price alerts for your crops.
              </p>
            </div>

            <div className="text-center p-6 border rounded-lg hover:shadow-lg transition-shadow">
              <div className="text-5xl mb-4">🎫</div>
              <h3 className="text-xl font-semibold mb-2">Digital Shop Tickets</h3>
              <p className="text-gray-600">
                Generate QR tickets for agri-shops to scan and recommend the right products for your farm.
              </p>
            </div>

            <div className="text-center p-6 border rounded-lg hover:shadow-lg transition-shadow">
              <div className="text-5xl mb-4">🚨</div>
              <h3 className="text-xl font-semibold mb-2">Outbreak Alerts</h3>
              <p className="text-gray-600">
                Get hyperlocal disease warnings within 3km of your farm with instant notifications.
              </p>
            </div>

            <div className="text-center p-6 border rounded-lg hover:shadow-lg transition-shadow">
              <div className="text-5xl mb-4">📱</div>
              <h3 className="text-xl font-semibold mb-2">Offline Support</h3>
              <p className="text-gray-600">
                Works without internet connection. Sync when you're back online.
              </p>
            </div>

            <div className="text-center p-6 border rounded-lg hover:shadow-lg transition-shadow">
              <div className="text-5xl mb-4">🤝</div>
              <h3 className="text-xl font-semibold mb-2">Referral System</h3>
              <p className="text-gray-600">
                Earn rewards by bringing neighbors to the platform and get discounts at partner shops.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Get Started</h2>
            <p className="text-lg text-gray-600">Choose your path to smart farming</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <a 
              href="/rai-ai" 
              className="h-24 flex flex-col gap-2 w-full text-lg bg-white border rounded-lg items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <span className="text-3xl">🌤️</span>
              <span>Weather Check</span>
            </a>
            <a 
              href="/rai-ai?view=scan" 
              className="h-24 flex flex-col gap-2 w-full text-lg bg-white border rounded-lg items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <span className="text-3xl">📱</span>
              <span>Scan Disease</span>
            </a>
            <a 
              href="/rai-ai?view=fields" 
              className="h-24 flex flex-col gap-2 w-full text-lg bg-white border rounded-lg items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <span className="text-3xl">📊</span>
              <span>View Fields</span>
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
