import { Link, Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <>
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link 
              to="/" 
              className="text-2xl font-bold text-green-600 hover:text-green-700 transition-colors"
            >
              🌾 RaiAI
            </Link>
            <nav className="hidden md:flex space-x-8">
              <Link 
                to="/prices" 
                className="text-gray-700 hover:text-green-600 transition-colors font-medium"
              >
                Prices
              </Link>
              <Link 
                to="/outbreak" 
                className="text-gray-700 hover:text-green-600 transition-colors font-medium"
              >
                Outbreak
              </Link>
              <Link 
                to="/about" 
                className="text-gray-700 hover:text-green-600 transition-colors font-medium"
              >
                About
              </Link>
              <Link 
                to="/support" 
                className="text-gray-700 hover:text-green-600 transition-colors font-medium"
              >
                Support
              </Link>
            </nav>
            
            {/* Mobile menu button */}
            <div className="md:hidden">
              <button className="text-gray-700 hover:text-green-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <Outlet />
      
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-lg mb-4">&copy; {new Date().getFullYear()} RaiAI. All rights reserved.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm">
            <a href="/about" className="text-blue-400 hover:text-blue-300">
              About Us
            </a>
            <span className="hidden sm:block">•</span>
            <a href="/prices" className="text-blue-400 hover:text-blue-300">
              Prices
            </a>
            <span className="hidden sm:block">•</span>
            <a href="/outbreak" className="text-blue-400 hover:text-blue-300">
              Outbreak
            </a>
            <span className="hidden sm:block">•</span>
            <a href="/support" className="text-blue-400 hover:text-blue-300">
              Support
            </a>
            <span className="hidden sm:block">•</span>
            <a href="mailto:support@raiai.app" className="text-blue-400 hover:text-blue-300">
              support@raiai.app
            </a>
            <span className="hidden sm:block">•</span>
            <a href="/api/health" className="text-blue-400 hover:text-blue-300">
              API Status
            </a>
            <span className="hidden sm:block">•</span>
            <a href="/counter" className="text-blue-400 hover:text-blue-300">
              Shop Counter
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
