"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";

import { auth } from "@/lib/firebase";
import { fetchJSON } from "@/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const token = await credential.user.getIdToken();
      localStorage.setItem("admin_token", token);
      localStorage.setItem("admin_email", credential.user.email ?? "");
      const profile = await fetchJSON(`/api/users/get_user/?email=${credential.user.email}`);
      if (profile.role !== "admin") {
        setError("Tài khoản chưa được cấp quyền admin.");
        return;
      }
      router.push("/dashboard");
    } catch (err: any) {
      console.error(err);
      setError("Đăng nhập thất bại. Vui lòng kiểm tra email/mật khẩu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0c0c0c] p-8 shadow-2xl">
      <h1 className="text-3xl font-bold mb-2 text-center">Sephora Admin</h1>
      <p className="text-center text-white/60 mb-8">Đăng nhập tài khoản quản trị</p>

      <form className="space-y-4" onSubmit={handleLogin}>
        <div>
          <label className="text-sm text-white/70">Email</label>
          <input
            type="email"
            className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white"
            placeholder="admin@sephora.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="text-sm text-white/70">Mật khẩu</label>
          <input
            type="password"
            className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-white text-black font-semibold py-2 hover:bg-gray-100 transition disabled:opacity-50"
        >
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>
    </div>
  );
}


