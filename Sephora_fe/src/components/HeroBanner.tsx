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
          <h3 className="font-bold text-lg">High-Shine Hair Oils</h3>
          <p className="text-sm">Get that great hair energy.</p>
          <button className="mt-2 underline text-sm font-semibold">
            SHOP NOW
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
          <h3 className="font-bold text-lg">Save BIG on Hair Care</h3>
          <p className="text-sm">
            New deals drop daily until 10/10. In store and online.
          </p>
          <button className="mt-2 underline text-sm font-semibold">
            SHOP NOW
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
            Bursting with the best beauty (for less $$). Meet this year&apos;s shop.
          </p>
          <button className="mt-2 underline text-sm font-semibold">
            SHOP NOW
          </button>
        </div>
      </div>
    </section>
  )
}
