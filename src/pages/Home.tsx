export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-jd-green-light to-jd-green-dark">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-jd-green to-jd-green-dark text-white py-24">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center mb-8">
            <div className="bg-white rounded-full p-4 mr-4">
              <span className="text-6xl">🌾</span>
            </div>
            <h1 className="font-thai text-farmer-5xl font-bold">RaiAI</h1>
          </div>
          <p className="font-thai text-farmer-3xl font-semibold mb-4">ผู้ช่วยเกษตรกรไทย</p>
          <p className="font-thai text-farmer-xl mb-12 opacity-90">
            สแกนโรคพืช • ตรวจอากาศ • ติดตามราคา
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <a 
              href="/rai-ai" 
              className="farmer-button bg-jd-yellow text-jd-green-dark hover:bg-jd-yellow-light font-thai font-bold text-farmer-xl px-12 py-6 rounded-xl shadow-lg transition-all transform hover:scale-105"
            >
              📱 ดาวน์โหลดแอป
            </a>
            <a 
              href="/counter" 
              className="farmer-button border-4 border-white text-white hover:bg-white hover:text-jd-green font-thai font-bold text-farmer-xl px-12 py-6 rounded-xl transition-all transform hover:scale-105"
            >
              🏪 เคาน์เตอร์ร้าน
            </a>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-thai text-farmer-4xl font-bold text-jd-green-dark mb-6">ฟีเจอร์หลัก</h2>
            <p className="font-thai text-farmer-xl text-gray-700">ทุกสิ่งที่เกษตรกรไทยต้องการ</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center p-8 border-4 border-jd-green-light rounded-xl hover:shadow-xl transition-all transform hover:scale-105 bg-gradient-to-b from-white to-jd-green-light bg-opacity-10">
              <div className="text-6xl mb-6">🔍</div>
              <h3 className="font-thai text-farmer-2xl font-bold mb-4 text-jd-green-dark">สแกนโรคพืช AI</h3>
              <p className="font-thai text-farmer-lg text-gray-700 leading-relaxed">
                ถ่ายรูปพืช รู้โรคทันที • แนะนำการรักษา • ใช้ได้กับข้าวและทุเรียน
              </p>
            </div>

            <div className="text-center p-8 border-4 border-jd-yellow rounded-xl hover:shadow-xl transition-all transform hover:scale-105 bg-gradient-to-b from-white to-jd-yellow bg-opacity-10">
              <div className="text-6xl mb-6">📊</div>
              <h3 className="font-thai text-farmer-2xl font-bold mb-4 text-jd-green-dark">ราคาแบบเรียลไทม์</h3>
              <p className="font-thai text-farmer-lg text-gray-700 leading-relaxed">
                ติดตามราคาตลาดทั่วไทย • แจ้งเตือนราคา • ข้อมูลอัปเดตทุกวัน
              </p>
            </div>

            <div className="text-center p-8 border-4 border-thai-blue rounded-xl hover:shadow-xl transition-all transform hover:scale-105 bg-gradient-to-b from-white to-thai-blue bg-opacity-10">
              <div className="text-6xl mb-6">🎫</div>
              <h3 className="font-thai text-farmer-2xl font-bold mb-4 text-jd-green-dark">ตั๋วดิจิทัล</h3>
              <p className="font-thai text-farmer-lg text-gray-700 leading-relaxed">
                สร้าง QR Code • แสดงให้ร้านค้า • แนะนำสินค้าที่เหมาะสม
              </p>
            </div>

            <div className="text-center p-8 border-4 border-thai-red rounded-xl hover:shadow-xl transition-all transform hover:scale-105 bg-gradient-to-b from-white to-thai-red bg-opacity-10">
              <div className="text-6xl mb-6">🚨</div>
              <h3 className="font-thai text-farmer-2xl font-bold mb-4 text-jd-green-dark">แจ้งเตือนโรคระบาด</h3>
              <p className="font-thai text-farmer-lg text-gray-700 leading-relaxed">
                เตือนภัยโรคในรัศมี 3 กม. • แจ้งทันที • ป้องกันก่อนเกิดโรค
              </p>
            </div>

            <div className="text-center p-8 border-4 border-jd-green rounded-xl hover:shadow-xl transition-all transform hover:scale-105 bg-gradient-to-b from-white to-jd-green bg-opacity-10">
              <div className="text-6xl mb-6">📱</div>
              <h3 className="font-thai text-farmer-2xl font-bold mb-4 text-jd-green-dark">ใช้ได้ไม่มีเน็ต</h3>
              <p className="font-thai text-farmer-lg text-gray-700 leading-relaxed">
                ทำงานในไร่ไม่มีสัญญาณ • ซิงค์ข้อมูลเมื่อมีเน็ต • ใช้ได้ทุกที่
              </p>
            </div>

            <div className="text-center p-8 border-4 border-thai-gold rounded-xl hover:shadow-xl transition-all transform hover:scale-105 bg-gradient-to-b from-white to-thai-gold bg-opacity-10">
              <div className="text-6xl mb-6">🤝</div>
              <h3 className="font-thai text-farmer-2xl font-bold mb-4 text-jd-green-dark">ระบบแนะนำเพื่อน</h3>
              <p className="font-thai text-farmer-lg text-gray-700 leading-relaxed">
                แนะนำเพื่อนบ้าน • ได้ส่วนลด • ได้รางวัล • ช่วยกันพัฒนาการเกษตร
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
