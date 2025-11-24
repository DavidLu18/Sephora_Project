import Image from "next/image"

export default function HeroBanner() {
  return (
    <section className="grid grid-cols-3 gap-4 px-6 py-6">
      {/* Banner 1 */}
      <div className="rounded-lg overflow-hidden flex flex-col bg-white">
        <Image
          src="/banners/banner1.jpg"
          alt="High-Shine Hair Oils promotion with Moroccanoil products"
          width={600}
          height={400}
          priority   
          className="w-full h-[300px] object-cover"
        />
        <div className="p-4 bg-purple-200">
          <h3 className="font-bold text-lg">Dầu dưỡng tóc bóng mượt</h3>
          <p className="text-sm">Cho mái tóc tràn đầy năng lượng</p>
          <button className="mt-2 underline text-sm font-semibold">
            MUA NGAY
          </button>
        </div>
      </div>

      {/* Banner 2 */}
      <div className="rounded-lg overflow-hidden flex flex-col bg-white">
        <Image
          src="/banners/banner2.jpg"
          alt="Hair Deals up to 50% Off"
          width={600}
          height={400}
          loading="lazy"
          className="w-full h-[300px] object-cover"
        />
        <div className="p-4 bg-pink-100">
          <h3 className="font-bold text-lg">Tiết kiệm KHỦNG khi chăm sóc tóc</h3>
          <p className="text-sm">
            Ưu đãi mới sẽ được áp dụng hàng ngày cho đến ngày 10/31.
          </p>
          <button className="mt-2 underline text-sm font-semibold">
            MUA NGAY
          </button>
        </div>
      </div>

      {/* Banner 3 */}
      <div className="rounded-lg overflow-hidden flex flex-col bg-white">
        <Image
          src="/banners/banner3.jpg"
          alt="Holiday Vaults gift sets and promotions"
          width={600}
          height={400}
          loading="lazy"
          className="w-full h-[300px] object-cover"
        />
        <div className="p-4 bg-purple-200">
          <h3 className="font-bold text-lg">Hello, Holiday Vaults!</h3>
          <p className="text-sm">
            Tràn ngập những món đồ đẹp nhất. Cùng khám phá cửa hàng.
          </p>
          <button className="mt-2 underline text-sm font-semibold">
            MUA NGAY
          </button>
        </div>
      </div>
    </section>
  )
}
