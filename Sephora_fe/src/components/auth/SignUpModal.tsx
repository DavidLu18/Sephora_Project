  "use client";
  import { useState } from "react";
  import {
    createUserWithEmailAndPassword,
    sendEmailVerification,
  } from "firebase/auth";
  import { FirebaseError } from "firebase/app";
  import { auth } from "@/lib/firebase";

  export default function SignUpModal({
    isOpen,
    onClose,
    onSwitchToSignIn,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onSwitchToSignIn: () => void;
  }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [emailError, setEmailError] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [loading, setLoading] = useState(false);

    

    if (!isOpen) return null;

    const validatePassword = () => {
      if (password.length < 6 || password.length > 12) {
        setPasswordError("Mật khẩu phải có độ dài từ 6 đến 12 ký tự.");
        return false;
      }
      if (password !== confirmPassword) {
        setPasswordError("Mật khẩu không khớp.");
        return false;
      }
      setPasswordError("");
      return true;
    };

    const handleSignUp = async (e: React.FormEvent) => {
      e.preventDefault();
      setEmailError("");
      setPasswordError("");
      setLoading(true);

      try {
        // 1. Tạo user Firebase
        const userCred = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );

        // 2. Gửi email xác minh
        await sendEmailVerification(userCred.user, {
          url: "http://localhost:3000/verify-email",
          handleCodeInApp: false,
        });

        // 3. Sign out ngay (RẤT QUAN TRỌNG)
        await auth.signOut();

        alert("Đã gửi email xác minh. Vui lòng kiểm tra hộp thư và bấm vào link.");

        onClose(); // đóng modal
      } catch (error) {
        if (error instanceof FirebaseError) {
          if (error.code === "auth/email-already-in-use") {
            setEmailError("Email đã tồn tại.");
          } else {
            setEmailError(error.message);
          }
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

          <h2 className="text-xl font-bold mb-4">Tạo tài khoản</h2>

          <form onSubmit={handleSignUp}>
            <input
              type="email"
              placeholder="Địa chỉ Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded px-3 py-2 mb-3"
              required
            />

            <input
              type="password"
              placeholder="Mật khẩu (6 - 12 ký tự)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded px-3 py-2 mb-3"
              required
            />

            <input
              type="password"
              placeholder="Xác nhận mật khẩu"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border rounded px-3 py-2 mb-3"
              required
            />

            {emailError && <p className="text-red-500 text-sm">{emailError}</p>}
            {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-black text-white py-2 rounded ${loading ? "opacity-50" : ""}`}
            >
              {loading ? "Đang xử lý..." : "Gửi xác minh email"}
            </button>

            <div className="text-center mt-4 text-sm text-gray-600">
              <p>Email xác minh sẽ được gửi đến <b>{email}</b></p>
              <p>Vui lòng kiểm tra email của bạn và bấm vào link xác nhận.</p>
            </div>
          </form>

          <div className="text-center mt-3">
            <p className="text-sm mb-2">Đã có tài khoản?</p>
            <button className="w-full border py-2 rounded" onClick={onSwitchToSignIn}>
              Đăng nhập
            </button>
          </div>
        </div>
      </div>
    );
  }
