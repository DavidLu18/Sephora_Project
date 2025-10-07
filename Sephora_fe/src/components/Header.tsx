"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Heart, ShoppingBag, User } from "lucide-react";

export default function Header() {
  const router = useRouter();
  const [isLoggedIn] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  // Modal state
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);

  const toggleMenu = (menu: string) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  return (
    <header className="border-b relative">
      {/* Top Banner */}
      <div className="bg-purple-200 text-center text-sm py-2">
        <strong>Pick up to 6 FREE Trial Sizes</strong> with $105 Spend. Online
        only. *Terms apply. Use code{" "}
        <strong className="text-red-600">BEAUTYSMGM</strong>
      </div>

      {/* Logo + Search + Icons */}
      <div className="flex items-center justify-between px-8 py-4">
        {/* Logo */}
        <div
          className="text-3xl font-bold cursor-pointer select-none"
          onClick={() => router.push("/")}
        >
          SEPHORA
        </div>

        {/* Search */}
        <div className="flex-1 max-w-xl mx-6">
          <div className="flex items-center border rounded-full px-4 py-2">
            <Search className="w-4 h-4 text-gray-500 mr-2" />
            <input
              type="text"
              placeholder="Search"
              className="flex-1 outline-none"
              autoComplete="off"
            />
          </div>
        </div>

        {/* Icons */}
        <div className="flex items-center gap-6 relative">
          {/* User */}
          <div className="relative">
            <User
              className="w-5 h-5 cursor-pointer"
              onClick={() => setIsSignInOpen(true)}
            />
          </div>

          {/* Wishlist */}
          <div className="relative">
            <Heart
              className="w-5 h-5 cursor-pointer"
              onClick={() => toggleMenu("wishlist")}
            />
            {!isLoggedIn && openMenu === "wishlist" && (
              <div className="absolute right-0 mt-2 w-56 bg-white shadow-lg rounded-lg p-4 text-sm z-50">
                <h4 className="font-semibold mb-2 select-none">My Lists</h4>
                <p className="text-gray-500 text-xs mb-3">
                  Sign in to organize and share your saved products.
                </p>
                <button
                  className="w-full bg-black text-white py-2 rounded mb-2"
                  onClick={() => setIsSignInOpen(true)}
                >
                  Sign In
                </button>
                <button
                  className="w-full border py-2 rounded"
                  onClick={() => setIsSignUpOpen(true)}
                >
                  Create Account
                </button>
              </div>
            )}
          </div>

          {/* Cart */}
          <div className="relative">
            <ShoppingBag
              className="w-5 h-5 cursor-pointer"
              onClick={() => toggleMenu("cart")}
            />
            {!isLoggedIn && openMenu === "cart" && (
              <div className="absolute right-0 mt-2 w-64 bg-white shadow-lg rounded-lg p-4 text-sm z-50">
                <h4 className="font-semibold mb-2 select-none">Shopping Bag</h4>
                <p className="text-gray-500 text-xs mb-3">
                  Your shopping bag is empty. Sign in to add products to your
                  cart.
                </p>
                <button
                  className="w-full bg-black text-white py-2 rounded mb-2"
                  onClick={() => setIsSignInOpen(true)}
                >
                  Sign In
                </button>
                <button
                  className="w-full border py-2 rounded"
                  onClick={() => setIsSignUpOpen(true)}
                >
                  Create Account
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* === Modal Sign In === */}
      {isSignInOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white w-[400px] rounded-lg shadow-lg p-6 relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-black"
              onClick={() => setIsSignInOpen(false)}
            >
              ✕
            </button>

            <h2 className="text-xl font-bold mb-2">Sign In</h2>
            <p className="text-sm text-gray-600 mb-4">
              Sign in or create an account to enjoy{" "}
              <span className="font-semibold">FREE standard shipping</span> on
              all orders.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                alert("Signed In!");
                setIsSignInOpen(false);
              }}
            >
              <input
                type="email"
                placeholder="Email Address"
                className="w-full border rounded px-3 py-2 mb-3"
                required
              />
              <input
                type="password"
                placeholder="Password"
                className="w-full border rounded px-3 py-2 mb-3"
                required
              />

              <div className="flex items-center justify-between mb-4">
                <label className="flex items-center text-sm">
                  <input type="checkbox" className="mr-2" /> Keep me signed in
                </label>
                <a href="#" className="text-sm text-blue-600 hover:underline">
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                className="w-full bg-black text-white py-2 rounded mb-4"
              >
                Sign In
              </button>
            </form>

            <div className="text-center">
              <p className="text-sm mb-2">New to Sephora?</p>
              <button
                className="w-full border py-2 rounded"
                onClick={() => {
                  setIsSignInOpen(false);
                  setIsSignUpOpen(true);
                }}
              >
                Create Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === Modal Sign Up === */}
      {isSignUpOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white w-[400px] rounded-lg shadow-lg p-6 relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-black"
              onClick={() => setIsSignUpOpen(false)}
            >
              ✕
            </button>

            <h2 className="text-xl font-bold mb-4">Create Account</h2>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                alert("Account Created!");
                setIsSignUpOpen(false);
              }}
            >
              <input
                type="text"
                placeholder="Full Name"
                className="w-full border rounded px-3 py-2 mb-3"
                required
              />
              <input
                type="email"
                placeholder="Email Address"
                className="w-full border rounded px-3 py-2 mb-3"
                required
              />
              <input
                type="password"
                placeholder="Password"
                className="w-full border rounded px-3 py-2 mb-3"
                required
              />

              <button
                type="submit"
                className="w-full bg-black text-white py-2 rounded mb-4"
              >
                Create Account
              </button>
            </form>

            <div className="text-center">
              <p className="text-sm mb-2">Already have an account?</p>
              <button
                className="w-full border py-2 rounded"
                onClick={() => {
                  setIsSignUpOpen(false);
                  setIsSignInOpen(true);
                }}
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
