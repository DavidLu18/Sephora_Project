"use client";
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { auth } from "@/lib/firebase";

export default function SignInModal({
  isOpen,
  onClose,
  onSwitchToSignUp,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToSignUp: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSignIn = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");
  setLoading(true);

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    if (!user.emailVerified) {
      setError("Email chưa được xác minh. Vui lòng kiểm tra hộp thư.");
      await auth.signOut();
      setLoading(false);
      return;
    }

    const token = await user.getIdToken(true);

    localStorage.setItem("token", token);

    alert(`Đăng nhập thành công! Chào ${user.email}`);

    onClose();  // đóng modal
  } catch (err: unknown) {
    if (err instanceof FirebaseError) {
      switch (err.code) {
        case "auth/user-not-found":
          setError("Tài khoản không tồn tại.");
          break;
        case "auth/wrong-password":
          setError("Sai mật khẩu. Vui lòng thử lại.");
          break;
        case "auth/too-many-requests":
          setError("Tài khoản bị khóa tạm thời do đăng nhập sai quá nhiều lần.");
          break;
        default:
          setError("Lỗi đăng nhập: " + err.message);
      }
    } else if (err instanceof Error) {
      setError(err.message);
    } else {
      setError("Đã xảy ra lỗi không xác định.");
    }
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white w-[400px] rounded-lg shadow-lg p-6 relative">
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-black"
          onClick={onClose}
        >
          ✕
        </button>

        <h2 className="text-xl font-bold mb-2">Đăng nhập</h2>
        <p className="text-sm text-gray-600 mb-4">
          Đăng nhập để trải nghiệm{" "}
          <span className="font-semibold">Miễn phí vận chuyển</span> cho mọi đơn hàng.
        </p>

        <form onSubmit={handleSignIn}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded px-3 py-2 mb-3"
            required
          />
          <input
            type="password"
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded px-3 py-2 mb-3"
            required
          />

          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

          <div className="flex items-center justify-between mb-4">
            <label className="flex items-center text-sm">
              <input type="checkbox" className="mr-2" /> Giữ đăng nhập
            </label>
            <a href="#" className="text-sm text-blue-600 hover:underline">
              Quên mật khẩu?
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-2 rounded mb-4"
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>

        <div className="text-center">
          <p className="text-sm mb-2">Người dùng mới?</p>
          <button
            className="w-full border py-2 rounded"
            onClick={onSwitchToSignUp}
          >
            Tạo tài khoản
          </button>
        </div>
      </div>
    </div>
  );
}
