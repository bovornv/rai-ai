export default function Prices() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Market Prices</h1>
          <p className="text-xl opacity-90">Real-time crop prices across Thailand</p>
        </div>
      </div>

      <div className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Current Prices</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Rice (Jasmine)</h3>
                <p className="text-2xl font-bold text-green-600">฿15,500/ton</p>
                <p className="text-sm text-gray-600">+2.5% from yesterday</p>
              </div>
              <div className="border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Durian (Monthong)</h3>
                <p className="text-2xl font-bold text-green-600">฿120/kg</p>
                <p className="text-sm text-gray-600">+5.2% from yesterday</p>
              </div>
              <div className="border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Rice (Sticky)</h3>
                <p className="text-2xl font-bold text-green-600">฿18,200/ton</p>
                <p className="text-sm text-gray-600">-1.1% from yesterday</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Price Trends</h2>
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <p className="text-lg text-gray-600 mb-4">Interactive price charts coming soon</p>
              <p className="text-sm text-gray-500">Track historical prices and trends for all major crops</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Price Alerts</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-semibold text-gray-900">Rice Price Alert</h3>
                  <p className="text-sm text-gray-600">Notify when rice price exceeds ฿16,000/ton</p>
                </div>
                <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                  Set Alert
                </button>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-semibold text-gray-900">Durian Price Alert</h3>
                  <p className="text-sm text-gray-600">Notify when durian price drops below ฿100/kg</p>
                </div>
                <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                  Set Alert
                </button>
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
