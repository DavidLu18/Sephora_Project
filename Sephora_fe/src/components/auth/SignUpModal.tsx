"use client";
import { useState, useEffect } from "react";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  onAuthStateChanged,
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

  // Theo dõi trạng thái xác minh email
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await user.reload();
        if (user.emailVerified) {
          try {
            // Khi email đã xác minh, gửi thông tin sang Django để lưu vào DB
            const response = await fetch("http://127.0.0.1:8000/api/users/register_user/", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                uid: user.uid,
                email: user.email,
              }),
            });

            if (response.ok) {
              // Kiểm tra xem user này đã từng được xử lý chưa
              const savedFlag = localStorage.getItem(`user_saved_${user.uid}`);
              if (!savedFlag) {
                localStorage.setItem(`user_saved_${user.uid}`, "true");
                alert("Đăng ký thành công! Tài khoản đã được lưu vào hệ thống.");
              }
              onClose();
            } else {
              const data = await response.json();
              alert(data.message || "Không thể lưu thông tin người dùng vào hệ thống.");
            }
          } catch (error) {
            console.error("Lỗi khi lưu thông tin người dùng:", error);
          }
        }
      }
    });

    return () => unsubscribe();
  }, [onClose]);

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

    if (auth.currentUser) {
      await auth.signOut();
    }

    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailRegex.test(email)) {
      setEmailError("Định dạng email không hợp lệ.");
      setLoading(false);
      return;
    }

    if (!validatePassword()) {
      setLoading(false);
      return;
    }

    try {
      // Kiểm tra email trên backend
      const res = await fetch("http://127.0.0.1:8000/api/users/check_email/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (res.status === 409) {
        setEmailError("Email đã tồn tại. Vui lòng đăng nhập.");
        setLoading(false);
        return;
      }
      if (!res.ok) {
        setEmailError(data.message || "Lỗi máy chủ khi kiểm tra email.");
        setLoading(false);
        return;
      }

      // Tạo tài khoản Firebase
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const actionCodeSettings = {
        url: "http://localhost:3000/?verifyEmail=true",
        handleCodeInApp: false,
      };
      await sendEmailVerification(userCred.user, actionCodeSettings);

      alert("Đã gửi email xác minh. Vui lòng kiểm tra hộp thư của bạn!");
      localStorage.setItem("signupEmail", email);
    } catch (error: unknown) {
      if (error instanceof FirebaseError) {
        if (error.code === "auth/email-already-in-use") {
          setEmailError("Email đã tồn tại. Vui lòng đăng nhập.");
        } else {
          setEmailError("Lỗi Firebase: " + error.message);
        }
      } else if (error instanceof Error) {
        setEmailError("Lỗi: " + error.message);
      } else {
        setEmailError("Đã xảy ra lỗi không xác định.");
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
            <p>Vui lòng kiểm tra hộp thư và bấm vào link xác nhận.</p>
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
