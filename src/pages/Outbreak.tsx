export default function Outbreak() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Outbreak Radar</h1>
          <p className="text-xl opacity-90">Hyperlocal disease alerts within 3km of your farm</p>
        </div>
      </div>

      <div className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Current Alerts</h2>
            <div className="space-y-4">
              <div className="border-l-4 border-red-500 bg-red-50 p-4 rounded-r-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-red-900">Rice Blast Disease</h3>
                    <p className="text-sm text-red-700">High risk detected in your area (2.1km away)</p>
                    <p className="text-xs text-red-600">Last updated: 2 hours ago</p>
                  </div>
                  <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    HIGH RISK
                  </span>
                </div>
              </div>
              
              <div className="border-l-4 border-yellow-500 bg-yellow-50 p-4 rounded-r-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-yellow-900">Durian Anthracnose</h3>
                    <p className="text-sm text-yellow-700">Moderate risk detected in your area (1.8km away)</p>
                    <p className="text-xs text-yellow-600">Last updated: 4 hours ago</p>
                  </div>
                  <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    MODERATE
                  </span>
                </div>
              </div>

              <div className="border-l-4 border-green-500 bg-green-50 p-4 rounded-r-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-green-900">Rice Brown Spot</h3>
                    <p className="text-sm text-green-700">Low risk detected in your area (2.9km away)</p>
                    <p className="text-xs text-green-600">Last updated: 6 hours ago</p>
                  </div>
                  <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    LOW RISK
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Outbreak Map</h2>
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🗺️</div>
              <p className="text-lg text-gray-600 mb-4">Interactive outbreak map coming soon</p>
              <p className="text-sm text-gray-500">View disease outbreaks in your area with real-time updates</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Prevention Tips</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Rice Blast Prevention</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Avoid excessive nitrogen fertilization</li>
                  <li>• Plant resistant varieties</li>
                  <li>• Maintain proper water management</li>
                  <li>• Apply fungicides preventively</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Durian Anthracnose Prevention</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Prune to improve air circulation</li>
                  <li>• Remove infected plant parts</li>
                  <li>• Apply copper-based fungicides</li>
                  <li>• Monitor humidity levels</li>
                </ul>
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
