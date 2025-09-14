import { Link, Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <>
      <header className="bg-jd-green shadow-lg border-b-4 border-jd-green-dark">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            <Link 
              to="/" 
              className="flex items-center space-x-3"
            >
              <div className="bg-white rounded-full p-2">
                <span className="text-2xl">🌾</span>
              </div>
              <h1 className="font-thai text-farmer-3xl font-bold text-white">RaiAI</h1>
            </Link>
            <nav className="hidden md:flex space-x-8">
              <Link 
                to="/prices" 
                className="font-thai text-farmer-lg font-medium text-white hover:text-jd-yellow transition-colors"
              >
                ราคา
              </Link>
              <Link 
                to="/outbreak" 
                className="font-thai text-farmer-lg font-medium text-white hover:text-jd-yellow transition-colors"
              >
                โรคระบาด
              </Link>
              <Link 
                to="/about" 
                className="font-thai text-farmer-lg font-medium text-white hover:text-jd-yellow transition-colors"
              >
                เกี่ยวกับ
              </Link>
              <Link 
                to="/support" 
                className="font-thai text-farmer-lg font-medium text-white hover:text-jd-yellow transition-colors"
              >
                ช่วยเหลือ
              </Link>
            </nav>
            
            {/* Mobile menu button */}
            <div className="md:hidden">
              <button className="text-white hover:text-jd-yellow transition-colors">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <Outlet />
      
      <footer className="bg-jd-green-dark text-white py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="bg-white rounded-full p-2">
              <span className="text-xl">🌾</span>
            </div>
            <h3 className="font-thai text-farmer-2xl font-bold">RaiAI</h3>
          </div>
          <p className="font-thai text-farmer-lg mb-6">ผู้ช่วยเกษตรกรไทย</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center text-farmer-base">
            <a href="/about" className="hover:text-jd-yellow transition-colors font-thai">เกี่ยวกับเรา</a>
            <span className="hidden sm:block">•</span>
            <a href="/prices" className="hover:text-jd-yellow transition-colors font-thai">ราคา</a>
            <span className="hidden sm:block">•</span>
            <a href="/outbreak" className="hover:text-jd-yellow transition-colors font-thai">โรคระบาด</a>
            <span className="hidden sm:block">•</span>
            <a href="/support" className="hover:text-jd-yellow transition-colors font-thai">ช่วยเหลือ</a>
            <span className="hidden sm:block">•</span>
            <a href="mailto:support@raiai.app" className="hover:text-jd-yellow transition-colors font-thai">support@raiai.app</a>
            <span className="hidden sm:block">•</span>
            <a href="/counter" className="hover:text-jd-yellow transition-colors font-thai">เคาน์เตอร์ร้าน</a>
          </div>
          <p className="font-thai text-farmer-sm mt-6 opacity-80">
            © {new Date().getFullYear()} RaiAI - พัฒนาเพื่อเกษตรกรไทย
          </p>
        </div>
      </footer>
    </>
  );
}
