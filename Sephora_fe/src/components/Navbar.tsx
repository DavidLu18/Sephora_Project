export default function Navbar() {
  const items = [
    "Gifts & Value Sets","New","Makeup","Skincare","Fragrance",
    "Hair","Tools & Brushes","Bath & Body","Brands","Mini Size",
    "Gift Cards","Sale & Offers"
  ]

  return (
    <nav className="bg-black text-white text-sm">
      <ul className="flex justify-center gap-6 px-6 py-3 overflow-x-auto">
        {items.map((item) => (
          <li key={item} className="cursor-pointer hover:underline">{item}</li>
        ))}
      </ul>
    </nav>
  )
}
