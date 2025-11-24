"use client";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { UserInfo } from "@/types/user";
import { FirebaseError } from "firebase/app";
import { 
  updateEmail,
  updatePassword, 
  sendEmailVerification, 
  EmailAuthProvider, 
  reauthenticateWithCredential,
  onAuthStateChanged, 
  signOut,
  reload,
} from "firebase/auth";

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [emailPendingVerification, setEmailPendingVerification] = useState(false);
  // Lấy user đang đăng nhập
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        router.push("/");
        return;
      }

      try {
        const res = await fetch(
          `http://127.0.0.1:8000/api/users/get_user/?email=${firebaseUser.email}`
        );
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        } else {
          setUser({ email: firebaseUser.email || "" });
        }
      } catch (err) {
        console.error("Lỗi khi lấy thông tin user:", err);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && emailPendingVerification) {
        await reload(firebaseUser);

        if (firebaseUser.emailVerified) {
          try {
            await fetch("http://127.0.0.1:8000/api/users/confirm_email_update/", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: user?.email,
                new_email: firebaseUser.email,
              }),
            });
            console.log("✅ Email đã xác thực và cập nhật backend");
            setEmailPendingVerification(false);
          } catch (err) {
            console.error("❌ Lỗi khi cập nhật email:", err);
          }
        }
      }
    });
    return () => unsubscribe();
  }, [emailPendingVerification, user]);
  interface UpdateFormData extends Partial<UserInfo> {
    new_email?: string;
    password?: string;
    newPassword?: string;
    currentPassword?: string;   
    confirmPassword?: string;
    dateofbirth?: string;
  }

  const [formData, setFormData] = useState<UpdateFormData>({});

  const handleUpdate = async (
    field: keyof UserInfo | "name" | "email" | "password" | "dateofbirth"
  ) => {
    if (!user) return;

    const payload: Partial<UserInfo> & { email: string; [key: string]: unknown } = {
      email: user.email,
    };

    try {
      if (field === "name") {
        payload.firstname = formData.firstname || user.firstname;
        payload.lastname = formData.lastname || user.lastname;
      } 
      else if (field === "email") {
        if (!formData.email) {
          alert("Vui lòng nhập email mới!");
          return;
        }

        if (!formData.currentPassword) {
          alert("Vui lòng nhập mật khẩu hiện tại để xác thực!");
          return;
        }

        try {
          if (auth.currentUser && auth.currentUser.email) {
            const credential = EmailAuthProvider.credential(
              auth.currentUser.email,
              formData.currentPassword
            );

            await reauthenticateWithCredential(auth.currentUser, credential);

            await updateEmail(auth.currentUser, formData.email);
            await sendEmailVerification(auth.currentUser);
            setEmailPendingVerification(true);

            alert("Email xác minh đã được gửi. Vui lòng kiểm tra hộp thư của bạn.");

            payload.new_email = formData.email;
          }
        } 
        catch (error) {
          console.error("Firebase email update error:", error);

          if (error instanceof FirebaseError) {
            switch (error.code) {
              case "auth/requires-recent-login":
                alert("Phiên đăng nhập đã cũ, vui lòng đăng nhập lại để đổi email.");
                break;

              case "auth/email-already-in-use":
                alert("Email này đã được sử dụng cho tài khoản khác.");
                break;

              case "auth/invalid-email":
                alert("Email không hợp lệ. Vui lòng nhập đúng định dạng.");
                break;

              default:
                alert("Không thể cập nhật email trên Firebase: " + error.message);
            }
          } else if (error instanceof Error) {
            // fallback cho lỗi JS thông thường
            alert("Lỗi không xác định: " + error.message);
          }

          return;
        }
      }


      else if (field === "password") {
        if (
          !formData.currentPassword ||
          !formData.newPassword ||
          !formData.confirmPassword
        ) {
          alert("Vui lòng nhập đầy đủ mật khẩu hiện tại, mật khẩu mới và xác nhận!");
          return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
          alert("Mật khẩu xác nhận không khớp!");
          return;
        }

        try {
          if (auth.currentUser && auth.currentUser.email) {
            const credential = EmailAuthProvider.credential(
              auth.currentUser.email,
              formData.currentPassword
            );
            await reauthenticateWithCredential(auth.currentUser, credential);

            await updatePassword(auth.currentUser, formData.newPassword);
          } else {
            alert("Không tìm thấy người dùng đang đăng nhập.");
            return;
          }
        } catch (error: unknown) {
          const firebaseError = error as { code?: string; message?: string };
          console.error("Firebase password update error:", firebaseError);

          if (firebaseError.code === "auth/wrong-password") {
            alert("Mật khẩu hiện tại không đúng.");
          } else if (firebaseError.code === "auth/too-many-requests") {
            alert("Bạn nhập sai quá nhiều lần. Vui lòng thử lại sau.");
          } else {
            alert(
              "Không thể cập nhật mật khẩu trên Firebase: " +
                (firebaseError.message || "Lỗi không xác định.")
            );
          }
          return;
        }

        payload.password = formData.newPassword;
      }
 
      else if (field === "dateofbirth") {
        let dob = formData.dateofbirth || user.dateofbirth || "";
        const parts = dob.split("-");
        if (parts.length === 3 && Number(parts[1]) > 12 && Number(parts[2]) <= 31) {
          dob = `${parts[0]}-${parts[2].padStart(2, "0")}-${parts[1].padStart(2, "0")}`;
        }
        payload.dateofbirth = dob;
      } 
      else {
        (payload as Record<string, unknown>)[field] =
          formData[field] || user[field];
      }

      const res = await fetch("http://127.0.0.1:8000/api/users/update_user/", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const updated = (await res.json()) as UserInfo;
        setUser(updated);
        setEditingField(null);
        alert("Cập nhật thành công!");
      } else {
        alert("Không thể cập nhật thông tin!");
      }
    } catch (err) {
      console.error("Lỗi khi cập nhật:", err);
    }
  };


  if (loading)
    return (
      <div className="p-10 text-center text-gray-500">
        Đang tải thông tin tài khoản...
      </div>
    );

  if (!user)
    return (
      <div className="p-10 text-center text-gray-500">
        Không tìm thấy thông tin tài khoản.
      </div>
    );

  return (
    <div className="flex justify-center py-10 px-6 bg-white text-black">
      <div className="max-w-6xl w-full flex gap-10">
        {/* Main Content */}
        <main className="flex-1">
          <h1 className="text-2xl font-semibold mb-3">Thông tin tài khoản</h1>
          <hr className="border-black mb-6" />

          {/* Họ Tên */}
          <InfoRow
            label="Họ Tên"
            value={`${user.firstname || ""} ${user.lastname || ""}`.trim() || "Chưa cập nhật"}
            editable
            textAction="Cập nhật"
            isEditing={editingField === "name"}
            onEdit={() => {
              setEditingField("name");
              setFormData({
                firstname: user.firstname || "",
                lastname: user.lastname || "",
              });
            }}
            onCancel={() => setEditingField(null)}
            onSave={() => handleUpdate("name")}
            renderInput={() => (
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Họ"
                  defaultValue={user.firstname || ""}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, firstname: e.target.value }))
                  }
                  className="border border-gray-400 rounded px-3 py-2 w-1/2"
                />
                <input
                  type="text"
                  placeholder="Tên"
                  defaultValue={user.lastname || ""}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, lastname: e.target.value }))
                  }
                  className="border border-gray-400 rounded px-3 py-2 w-1/2"
                />
              </div>
            )}
          />

          <InfoRow
            label="Email"
            value={user.email}
            editable
            textAction="Cập nhật"
            isEditing={editingField === "email"}
            onEdit={() => {
              setEditingField("email");
              setFormData({
                email: user.email,
                currentPassword: "",
              });
            }}
            onCancel={() => setEditingField(null)}
            onSave={() => handleUpdate("email")}
            renderInput={() => (
              <div className="flex flex-col gap-3 w-1/2">
                <input
                  type="text"
                  name="fake_username"
                  style={{ display: "none" }}
                  autoComplete="username"
                />
                <input
                  type="password"
                  name="fake_password"
                  style={{ display: "none" }}
                  autoComplete="new-password"
                />
                <input
                  type="email"
                  placeholder="Email mới"
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, email: e.target.value }))
                  }
                  className="border border-gray-400 rounded px-3 py-2"
                />
                <input
                  type="password"
                  placeholder="Nhập mật khẩu hiện tại để xác thực"
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, currentPassword: e.target.value }))
                  }
                  className="border border-gray-400 rounded px-3 py-2"
                />
              </div>
            )}
          />


          {/* Số điện thoại */}
          <InfoRow
            label="Số điện thoại"
            value={user.phone || "Chưa cập nhật"}
            editable
            textAction="Cập nhật"
            isEditing={editingField === "phone"}
            onEdit={() => {
              setEditingField("phone");
              setFormData({ phone: user.phone || "" });
            }}
            onCancel={() => setEditingField(null)}
            onSave={() => handleUpdate("phone")}
            renderInput={() => (
              <input
                type="text"
                placeholder="Số điện thoại"
                defaultValue={user.phone || ""}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, phone: e.target.value }))
                }
                className="border border-gray-400 rounded px-3 py-2 w-1/2"
              />
            )}
          />

          {/* Mật khẩu */}
          <InfoRow
            label="Mật khẩu"
            value="••••••••"
            editable
            textAction="Đổi mật khẩu"
            isEditing={editingField === "password"}
            
            onEdit={() => {
              setEditingField("password");
              setFormData({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
              });
            }}
            onCancel={() => setEditingField(null)}
            onSave={() => handleUpdate("password")}
            renderInput={() => (
              <>
                {/* Ẩn input giả để Chrome autofill vào đây thay vì form thật */}
                <input
                  type="text"
                  name="fake_username"
                  style={{ display: "none" }}
                  autoComplete="username"
                />
                <input
                  type="password"
                  name="fake_password"
                  style={{ display: "none" }}
                  autoComplete="new-password"
                />
                <form
                  autoComplete="new-password"
                  onSubmit={(e) => e.preventDefault()}
                  className="flex flex-col gap-3 w-1/2"
                >
                  <input
                    type="password"
                    placeholder="Mật khẩu hiện tại"
                    name="old_pw"
                    autoComplete="new-password"
                    readOnly
                    onFocus={(e) => e.target.removeAttribute("readonly")}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, currentPassword: e.target.value }))
                    }
                    className="border border-gray-400 rounded px-3 py-2"
                  />

                  <input
                    type="password"
                    placeholder="Mật khẩu mới"
                    name="new_pw"
                    autoComplete="new-password"
                    readOnly
                    onFocus={(e) => e.target.removeAttribute("readonly")}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, newPassword: e.target.value }))
                    }
                    className="border border-gray-400 rounded px-3 py-2"
                  />

                  <input
                    type="password"
                    placeholder="Xác nhận mật khẩu mới"
                    name="confirm_pw"
                    autoComplete="new-password"
                    readOnly
                    onFocus={(e) => e.target.removeAttribute("readonly")}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, confirmPassword: e.target.value }))
                    }
                    className="border border-gray-400 rounded px-3 py-2"
                  />
                </form>
              </>
            )}
          />


          {/* Ngày sinh */}
          <InfoRow
            label="Ngày sinh"
            value={user.dateofbirth || "Chưa cập nhật"}
            editable
            textAction="Cập nhật"
            isEditing={editingField === "dateofbirth"}
            onEdit={() => {
              setEditingField("dateofbirth");
              setFormData({ dateofbirth: user.dateofbirth || "" });
            }}
            onCancel={() => setEditingField(null)}
            onSave={() => handleUpdate("dateofbirth")}
            renderInput={() => (
              <input
                type="text"
                placeholder="YYYY-MM-DD"
                defaultValue={
                  user.dateofbirth
                    ? new Date(user.dateofbirth).toISOString().split("T")[0]
                    : ""
                }
                onChange={(e) =>
                  setFormData((f) => ({ ...f, dateofbirth: e.target.value }))
                }
                pattern="\d{4}-\d{2}-\d{2}"
                title="Định dạng: Năm-Tháng-Ngày (VD: 2000-05-09)"
                className="border border-gray-400 rounded px-3 py-2 w-1/2"
              />
            )}
          />

          {/* Logout */}
          <div className="mt-10">
            <button
              className="bg-red-600 text-white px-4 py-2 rounded"
              onClick={async () => {
                await signOut(auth);
                router.push("/");
              }}
            >
              Đăng xuất
            </button>
          </div>
        </main>
      </div>
    </div>
  );


}

function InfoRow({
  label,
  value,
  editable,
  textAction,
  isEditing,
  onEdit,
  onCancel,
  onSave,
  renderInput,
}: {
  label: string;
  value: string;
  editable?: boolean;
  textAction?: string;
  isEditing?: boolean;
  onEdit?: () => void;
  onCancel?: () => void;
  onSave?: () => void;
  renderInput?: () => React.ReactNode;
}) {
  return (
    <div className="border-b py-4">
      {/* Khi KHÔNG chỉnh sửa */}
      {!isEditing && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-10 w-full">
            <p className="font-semibold w-48">{label}</p>
            <p className="text-sm flex-1">{value}</p>
          </div>
          {editable && (
            <button
              onClick={onEdit}
              className="text-blue-700 underline text-sm whitespace-nowrap"
            >
              {textAction || "Cập nhật"}
            </button>
          )}
        </div>
      )}

      {/* Khi đang chỉnh sửa */}
      {isEditing && (
        <div className="flex flex-col mt-3">
          {renderInput && renderInput()}
          <div className="flex gap-3 mt-3">
            <button
              onClick={onCancel}
              className="border border-black rounded-full px-6 py-2 text-sm font-semibold"
            >
              Hủy
            </button>
            <button
              onClick={onSave}
              className="bg-black text-white rounded-full px-6 py-2 text-sm font-semibold"
            >
              Lưu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
