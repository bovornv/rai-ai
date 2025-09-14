export default function About() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">About RaiAI</h1>
          <p className="text-xl opacity-90">Built for Thai rice & durian farmers. Offline-first. Thai UX.</p>
        </div>
      </div>

      <div className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
            <p className="text-lg text-gray-700 mb-6">
              RaiAI empowers Thai farmers with cutting-edge AI technology to diagnose crop diseases, 
              track market prices, and make informed decisions for better yields.
            </p>
            <p className="text-lg text-gray-700">
              We understand the unique challenges of farming in Thailand and have built our platform 
              specifically for rice and durian farmers, with offline-first functionality and Thai language support.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Technology</h2>
            <p className="text-lg text-gray-700 mb-4">
              Built with modern web technologies and advanced machine learning models trained specifically 
              for Thai crops:
            </p>
            <ul className="text-lg text-gray-700 space-y-2 ml-4">
              <li>• React & TypeScript for the frontend</li>
              <li>• Express.js API server</li>
              <li>• Machine learning models for rice and durian disease detection</li>
              <li>• Real-time price data integration</li>
              <li>• Offline-first architecture</li>
              <li>• Mobile-responsive design</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">AI-Powered Diagnosis</h3>
                <p className="text-gray-700">Upload crop photos for instant disease detection and treatment recommendations.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Real-time Prices</h3>
                <p className="text-gray-700">Track market prices across Thailand with live updates and alerts.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Digital Shop Tickets</h3>
                <p className="text-gray-700">Generate QR tickets for agri-shops to recommend products.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Outbreak Alerts</h3>
                <p className="text-gray-700">Get hyperlocal disease warnings within 3km of your farm.</p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <a 
              href="/" 
              className="inline-block bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              ← Back to Home
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
