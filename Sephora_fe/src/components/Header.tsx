"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Heart, ShoppingBag, User } from "lucide-react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import SignInModal from "./auth/SignInModal";
import SignUpModal from "./auth/SignUpModal";

export default function Header() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [lastName, setLastName] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  // Toggle menu for Wishlist or Cart
  const toggleMenu = (menu: string) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  // Fetch cart count based on user's token
  const fetchCart = async (token: string) => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/cart/", {
        headers: { Authorization: `Bearer ${token}` }, // Send token in Authorization header
      });

      if (res.ok) {
        const data = await res.json();
        const count = data.items?.length || 0;
        setCartCount(count);
      } else {
        console.error("Error fetching cart:", res.status);
      }
    } catch (err) {
      console.error("Error fetching cart:", err);
    }
  };

  // Monitor Firebase user authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUserEmail(firebaseUser.email);

        try {
          const token = await firebaseUser.getIdToken(true); // Get fresh token
          await fetchCart(token); // Fetch cart with the token
        } catch (err) {
          console.error("Error getting Firebase token:", err);
        }

        try {
          const res = await fetch(
            `http://127.0.0.1:8000/api/users/get_user/?email=${firebaseUser.email}`
          );
          if (res.ok) {
            const data = await res.json();
            setLastName(data.lastname || "");
          }
        } catch (err) {
          console.error("Error fetching last name from backend:", err);
        }
      } else {
        setUserEmail(null);
        setLastName(null);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!userEmail) {
        setCartCount(0);
        return;
      }

      try {
        const token = await auth.currentUser?.getIdToken(true); // Get fresh token
        if (token) {
          await fetchCart(token); // Fetch cart with the fresh token
        }
      } catch (err) {
        console.error("Error getting Firebase token:", err);
      }
    };

    fetchData();
  }, [userEmail]);

  const handleSignOut = async () => {
    await signOut(auth);
    setUserEmail(null);
    setShowUserDropdown(false);
    alert("Successfully signed out!");
    router.push("/");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    router.push(`/search?query=${encodeURIComponent(searchTerm.trim())}`);
  };

  // Close dropdown if clicked outside
  useEffect(() => {
    
    const handleClickOutside = (e: MouseEvent) => {
      
      const target = e.target as HTMLElement;
      if (!target.closest(".user-dropdown-area")) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleCartUpdated = async () => {
      // Lấy token mới từ Firebase
      const token = await auth.currentUser?.getIdToken(true);  // true để lấy token mới nhất
      if (!token) {
        console.error("Không thể lấy token, vui lòng đăng nhập lại.");
        return;
      }

      // Gọi API để lấy giỏ hàng mới với token mới
      try {
        await fetchCart(token);  // Hàm này sẽ gọi API giỏ hàng
      } catch (error) {
        console.error("Lỗi khi lấy giỏ hàng:", error);
      }
    };

    // Lắng nghe sự kiện cartUpdated
    window.addEventListener("cartUpdated", handleCartUpdated);

    // Cleanup khi component unmount
    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdated);
    };
  }, []);


  return (
    <header className="border-b relative">
      <div className="bg-purple-200 text-center text-sm py-2">
        <strong>Pick up to 6 FREE Trial Sizes</strong> with $105 Spend. Online only. *Terms apply. Use code{" "}
        <strong className="text-red-600">BEAUTYSMGM</strong>
      </div>

      <div className="flex items-center justify-start px-10 h-18 gap-8">
        {/* Logo */}
        <div
          className="text-4xl font-bold cursor-pointer select-none leading-none flex items-center"
          onClick={() => router.push("/")}
        >
          SEPHORA
        </div>

        {/* Search */}
        <form
          onSubmit={handleSearch}
          className="flex items-center flex-1 justify-center mx-10"
        >
          <div className="flex items-center border border-gray-400 rounded-full px-4 py-2 w-full max-w-2xl h-11">
            <Search className="w-5 h-5 text-gray-500 mr-3 cursor-pointer" onClick={handleSearch} />
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 outline-none"
              autoComplete="off"
            />
          </div>
        </form>

        {/* Icons & User */}
        <div className="flex items-center gap-6 relative">
          {/* User */}
          <div className="relative user-dropdown-area flex items-center gap-2 cursor-pointer">
            {!userEmail ? (
              <User
                className="w-5 h-5 cursor-pointer"
                onClick={() => setIsSignInOpen(true)}
              />
            ) : (
              <div
                className="cursor-pointer flex items-center gap-2 font-medium select-none"
                onClick={() => setShowUserDropdown(!showUserDropdown)}
              >
                <User className="w-5 h-5" />
                <span>
                  Hi, <span className="text-gray-700">{lastName || userEmail}</span>
                </span>
              </div>
            )}

            {showUserDropdown && userEmail && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white border rounded-lg shadow-lg text-sm z-[100]">
                <button
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                  onClick={() => {
                    setShowUserDropdown(false);
                    router.push("/account");
                  }}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <div>
                    <span>Thiết lập tài khoản</span>
                    <p className="text-xs text-gray-500">Liên lạc, Email, Password</p>
                  </div>
                </button>
                <button
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                  onClick={() => {
                    setShowUserDropdown(false);
                    router.push("/account/orders");
                  }}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <div>
                    <span>Đơn hàng</span>
                    <p className="text-xs text-gray-500">Xem thông tin, trạng thái đơn hàng.</p>
                  </div>
                </button>
                <button
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
                  onClick={handleSignOut}
                >
                  Đăng xuất
                </button>
              </div>
            )}
          </div>

          {/* Wishlist */}
          <div className="relative">
            <Heart
              className="w-5 h-5 cursor-pointer"
              onClick={() => toggleMenu("wishlist")}
            />
            {!userEmail && openMenu === "wishlist" && (
              <div className="absolute right-0 mt-2 w-56 bg-white shadow-lg rounded-lg p-4 text-sm z-50">
                <h4 className="font-semibold mb-2 select-none">Danh sách yêu thích</h4>
                <p className="text-gray-500 text-xs mb-3">Đăng nhập để xem danh sách của bạn.</p>
                <button
                  className="w-full bg-black text-white py-2 rounded mb-2"
                  onClick={() => setIsSignInOpen(true)}
                >
                  Đăng nhập
                </button>
                <button
                  className="w-full border py-2 rounded"
                  onClick={() => setIsSignUpOpen(true)}
                >
                  Đăng kí
                </button>
              </div>
            )}
          </div>

          {/* Cart */}
          <div className="relative">
            <ShoppingBag
                className="w-5 h-5 cursor-pointer"
                onClick={() => {
                  if (userEmail) {
                    router.push("/cart");
                  } else {
                    toggleMenu("cart");
                  }
                }}
              />
              {userEmail && cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-semibold rounded-full px-1.5 py-0.5">
                  {cartCount}
                </span>
              )}
            {!userEmail && openMenu === "cart" && (
              <div className="absolute right-0 mt-2 w-64 bg-white shadow-lg rounded-lg p-4 text-sm z-50">
                <h4 className="font-semibold mb-2 select-none">Giỏ hàng</h4>
                <p className="text-gray-500 text-xs mb-3">
                  Giỏ hàng đang rỗng. Đăng nhập để thêm vào giỏ hàng.
                </p>
                <button
                  className="w-full bg-black text-white py-2 rounded mb-2"
                  onClick={() => setIsSignInOpen(true)}
                >
                  Đăng nhập
                </button>
                <button
                  className="w-full border py-2 rounded"
                  onClick={() => setIsSignUpOpen(true)}
                >
                  Đăng kí
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Đăng nhập */}
      <SignInModal
        isOpen={isSignInOpen}
        onClose={() => setIsSignInOpen(false)}
        onSwitchToSignUp={() => {
          setIsSignInOpen(false);
          setIsSignUpOpen(true);
        }}
      />

      {/* Modal Đăng ký */}
      <SignUpModal
        isOpen={isSignUpOpen}
        onClose={() => setIsSignUpOpen(false)}
        onSwitchToSignIn={() => {
          setIsSignUpOpen(false);
          setIsSignInOpen(true);
        }}
      />
    </header>
  );
}
