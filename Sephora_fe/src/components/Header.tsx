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

  const [searchTerm, setSearchTerm] = useState("");
  
  const toggleMenu = (menu: string) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  // Theo dõi trạng thái đăng nhập Firebase
   useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUserEmail(firebaseUser.email);

        try {
          // 🔸 Gọi API PostgreSQL để lấy thông tin user (bao gồm lastname)
          const res = await fetch(
            `http://127.0.0.1:8000/api/users/get_user/?email=${firebaseUser.email}`
          );
          if (res.ok) {
            const data = await res.json();
            setLastName(data.lastname || "");
          }
        } catch (err) {
          console.error("Lỗi khi lấy lastname từ backend:", err);
        }
      } else {
        setUserEmail(null);
        setLastName(null);
      }
    });
    return () => unsubscribe();
  }, []);
  
  const handleSignOut = async () => {
    await signOut(auth);
    setUserEmail(null);
    setShowUserDropdown(false);
    alert("Đã đăng xuất thành công!");
    router.push("/");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    router.push(`/search?query=${encodeURIComponent(searchTerm.trim())}`);
  };

  // Khi click ra ngoài dropdown thì đóng lại
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

  return (
    <header className="border-b relative">
      <div className="bg-purple-200 text-center text-sm py-2">
        <strong>Pick up to 6 FREE Trial Sizes</strong> with $105 Spend. Online only. *Terms apply. Use code{" "}
        <strong className="text-red-600">BEAUTYSMGM</strong>
      </div>

      <div className="flex items-center justify-between px-8 py-4">
        {/* Logo */}
        <div
          className="text-3xl font-bold cursor-pointer select-none"
          onClick={() => router.push("/")}
        >
          SEPHORA
        </div>

        {/* Search */}
         <form
          onSubmit={handleSearch}
          className="flex-1 max-w-xl mx-6"
        >
          <div className="flex items-center border rounded-full px-4 py-2">
            <Search
              className="w-4 h-4 text-gray-500 mr-2 cursor-pointer"
              onClick={handleSearch}
            />
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
          <div className="relative user-dropdown-area">
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
              <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg text-sm z-50">
                <button
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                  onClick={() => {
                    setShowUserDropdown(false);
                    router.push("/account");
                  }}
                >
                  Thiết lập tài khoản.
                </button>
                <button
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
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
                    // 🔸 Nếu đã đăng nhập → chuyển đến trang giỏ hàng
                    router.push("/cart");
                  } else {
                    // 🔸 Nếu chưa đăng nhập → mở dropdown yêu cầu đăng nhập
                    toggleMenu("cart");
                  }
                }}
              />
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
