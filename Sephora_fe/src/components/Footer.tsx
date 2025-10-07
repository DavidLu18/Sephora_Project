export default function Footer() {
  return (
    <footer className="bg-black text-white mt-10 px-8 py-10">
      <div className="grid grid-cols-4 gap-6 text-sm">
        <div>
          <h4 className="font-bold mb-2">Về Sephora</h4>
          <ul className="space-y-1">
            <li>Về chúng tôi</li>
            <li>Việc làm</li>
            <li>Tin tức</li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-2">My Sephora</h4>
          <ul className="space-y-1">          
            <li>Trạng thái đơn hàng</li>
            <li>Quà tặng</li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-2">Hỗ trợ</h4>
          <ul className="space-y-1">
            <li>Khách hàng</li>
            <li>Đổi & Trả</li>
            <li>Vận chuyển</li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-2">Khu vực - Ngôn ngữ</h4>
          <p>Việt Nam - Tiếng Việt</p>
        </div>
      </div>
      <p className="text-center text-xs mt-6 text-gray-400">
        © 2025 Sephora Clone. All rights reserved.
      </p>
    </footer>
  )
}
