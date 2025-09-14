export default function Support() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Support</h1>
          <p className="text-xl opacity-90">Get help with RaiAI</p>
        </div>
      </div>

      <div className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Email Support</h3>
                  <a 
                    href="mailto:support@raiai.app" 
                    className="text-green-600 hover:text-green-700"
                  >
                    support@raiai.app
                  </a>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Response Time</h3>
                  <p className="text-gray-600">Within 24 hours</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Languages</h3>
                  <p className="text-gray-600">English & Thai</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Help</h2>
              <div className="space-y-4">
                <a 
                  href="/about" 
                  className="block text-green-600 hover:text-green-700 font-medium"
                >
                  → How does RaiAI work?
                </a>
                <a 
                  href="/prices" 
                  className="block text-green-600 hover:text-green-700 font-medium"
                >
                  → Understanding price data
                </a>
                <a 
                  href="/outbreak" 
                  className="block text-green-600 hover:text-green-700 font-medium"
                >
                  → Reading outbreak alerts
                </a>
                <a 
                  href="/counter" 
                  className="block text-green-600 hover:text-green-700 font-medium"
                >
                  → Shop counter setup
                </a>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">How accurate is the AI diagnosis?</h3>
                <p className="text-gray-700">
                  Our AI models are trained on thousands of crop images and achieve 95%+ accuracy 
                  for rice and durian disease detection. Results are best with clear, well-lit photos.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Does RaiAI work offline?</h3>
                <p className="text-gray-700">
                  Yes! RaiAI is designed for offline-first use. You can scan crops and view your 
                  field data without internet. Data syncs automatically when you're back online.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">How do I get price alerts?</h3>
                <p className="text-gray-700">
                  Set up price alerts in the mobile app. You'll receive notifications when prices 
                  reach your target levels for rice, durian, and other crops.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Is RaiAI free to use?</h3>
                <p className="text-gray-700">
                  Yes, RaiAI is free for individual farmers. We also offer premium features for 
                  agri-shops and cooperatives.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Report a Problem</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Email
                </label>
                <input 
                  type="email" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Problem Type
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option>App not working</option>
                  <option>Incorrect diagnosis</option>
                  <option>Price data issue</option>
                  <option>Account problem</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea 
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Please describe the problem in detail..."
                ></textarea>
              </div>
              <button 
                type="submit"
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Send Report
              </button>
            </form>
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
