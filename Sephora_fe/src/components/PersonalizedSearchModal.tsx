"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

import { personalizedSearch, PersonalizedSearchPayload } from "@/api";
import { savePersonalizedResponse } from "@/lib/personalizedStorage";

const SKIN_TYPES = [
  { value: "oily", label: "Da dầu" },
  { value: "dry", label: "Da khô" },
  { value: "combination", label: "Da hỗn hợp" },
  { value: "sensitive", label: "Da nhạy cảm" },
  { value: "normal", label: "Da thường" },
];

const SKIN_CONCERNS = [
  { value: "acne", label: "Mụn/ Mụn đầu đen" },
  { value: "dark_spots", label: "Thâm/ Sạm" },
  { value: "wrinkles", label: "Lão hóa/ Nếp nhăn" },
  { value: "dryness", label: "Khô/ Thiếu ẩm" },
  { value: "redness", label: "Da đỏ/ Kích ứng" },
  { value: "large_pores", label: "Lỗ chân lông to" },
];

const AGE_OPTIONS = [
  { value: "under-20", label: "Dưới 20" },
  { value: "20-25", label: "20 - 25" },
  { value: "26-30", label: "26 - 30" },
  { value: "31-40", label: "31 - 40" },
  { value: "41-50", label: "41 - 50" },
  { value: "over-50", label: "Trên 50" },
];

const SKIN_TONES = [
  { value: "fair", label: "Rất sáng" },
  { value: "light", label: "Sáng" },
  { value: "medium", label: "Trung bình" },
  { value: "tan", label: "Ngăm" },
  { value: "deep", label: "Sâu" },
];

const FRAGRANCE_PREFS = [
  { value: "no_fragrance", label: "Không mùi" },
  { value: "light", label: "Nhẹ nhàng" },
  { value: "floral", label: "Hương hoa" },
  { value: "fresh", label: "Thanh mát" },
  { value: "woody", label: "Gỗ ấm" },
];

const EYE_COLORS = [
  { value: "black", label: "Đen" },
  { value: "brown", label: "Nâu" },
  { value: "hazel", label: "Hạt dẻ" },
  { value: "blue", label: "Xanh biển" },
  { value: "green", label: "Xanh lá" },
  { value: "gray", label: "Xám" },
];

const HAIR_COLORS = [
  { value: "black", label: "Đen" },
  { value: "brown", label: "Nâu" },
  { value: "blonde", label: "Vàng" },
  { value: "red", label: "Đỏ" },
  { value: "auburn", label: "Nâu đỏ" },
  { value: "platinum", label: "Bạch kim" },
];

const ALLERGY_OPTIONS = [
  { value: "fragrance", label: "Hương liệu" },
  { value: "paraben", label: "Paraben" },
  { value: "sulfate", label: "Sulfate" },
  { value: "silicone", label: "Silicone" },
  { value: "alcohol", label: "Cồn khô" },
  { value: "none", label: "Không có dị ứng" },
];

const SEARCH_INTENTS = [
  {
    value: "moisturizer",
    label: "Kem dưỡng ẩm",
    description: "Khóa ẩm, phục hồi hàng rào da",
    query: "kem dưỡng",
  },
  {
    value: "cleanser",
    label: "Sữa rửa mặt",
    description: "Làm sạch dịu nhẹ cho mọi loại da",
    query: "sữa rửa mặt",
  },
  {
    value: "makeup-remover",
    label: "Tẩy trang",
    description: "Loại bỏ lớp makeup & SPF",
    query: "tẩy trang",
  },
  {
    value: "serum",
    label: "Serum đặc trị",
    description: "Nhắm đến các vấn đề da chuyên sâu",
    query: "serum",
  },
  {
    value: "sunscreen",
    label: "Chống nắng",
    description: "Bảo vệ da khỏi tia UV/UVB",
    query: "kem chống nắng",
  },
  {
    value: "mask",
    label: "Mặt nạ dưỡng",
    description: "Thư giãn & cấp ẩm tức thì",
    query: "mặt nạ",
  },
  {
    value: "lipstick",
    label: "Trang điểm môi",
    description: "Son dưỡng, son màu",
    query: "son",
  },
  {
    value: "hair",
    label: "Chăm sóc tóc",
    description: "Dầu gội, dưỡng & phục hồi",
    query: "dầu gội",
  },
];

const BUDGET_OPTIONS = [
  { value: "under_500k", label: "Dưới 500.000đ" },
  { value: "500k_1m", label: "500.000đ - 1.000.000đ" },
  { value: "over_1m", label: "Trên 1.000.000đ" },
];

const CLIMATE_OPTIONS = [
  { value: "hot_humid", label: "Khí hậu nóng ẩm / ngoài trời nhiều" },
  { value: "air_con", label: "Trong phòng lạnh/điều hòa" },
  { value: "cool_dry", label: "Khí hậu mát/lạnh, khô" },
];

const ROUTINE_OPTIONS = [
  { value: "minimal", label: "Tối giản (3 bước cơ bản)" },
  { value: "balanced", label: "Đầy đủ (4-5 bước thường xuyên)" },
  { value: "advanced", label: "Chuyên sâu (6+ bước & treatment)" },
];

interface PersonalizedSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery?: string;
  userEmail?: string | null;
  allowSaveProfile?: boolean;
}

interface FormState {
  searchQuery: string;
  searchIntent: string;
  skinType: string;
  skinConcerns: string[];
  ageRange: string;
  skinTone: string;
  eyeColor: string;
  hairColor: string;
  allergyInfo: string[];
  fragrancePref: string;
  budgetLevel: string;
  climate: string;
  routineFocus: string;
  saveProfile: boolean;
}

const INITIAL_FORM: FormState = {
  searchQuery: "",
  searchIntent: "",
  skinType: "",
  skinConcerns: [],
  ageRange: "",
  skinTone: "",
  eyeColor: "",
  hairColor: "",
  allergyInfo: [],
  fragrancePref: "",
  budgetLevel: "",
  climate: "",
  routineFocus: "",
  saveProfile: false,
};

export default function PersonalizedSearchModal({
  isOpen,
  onClose,
  searchQuery = "",
  userEmail,
  allowSaveProfile = false,
}: PersonalizedSearchModalProps) {
  const router = useRouter();
  const [formState, setFormState] = useState<FormState>({ ...INITIAL_FORM, searchQuery });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const normalizedQuery = (searchQuery || "").toLowerCase();
      const matchedIntent = SEARCH_INTENTS.find(
        (intent) => intent.query.toLowerCase() === normalizedQuery
      );
      setFormState((prev) => ({
        ...prev,
        searchQuery,
        searchIntent: matchedIntent ? matchedIntent.value : "",
      }));
      setError(null);
    }
  }, [searchQuery, isOpen]);

  const canSubmit = useMemo(() => {
    return (
      Boolean(formState.searchIntent) &&
      Boolean(formState.skinType) &&
      formState.skinConcerns.length > 0
    );
  }, [formState.searchIntent, formState.skinType, formState.skinConcerns.length]);

  if (!isOpen) {
    return null;
  }

  const handleConcernToggle = (concern: string) => {
    setFormState((prev) => {
      const exists = prev.skinConcerns.includes(concern);
      return {
        ...prev,
        skinConcerns: exists
          ? prev.skinConcerns.filter((item) => item !== concern)
          : [...prev.skinConcerns, concern],
      };
    });
  };

  const handleAllergyToggle = (value: string) => {
    setFormState((prev) => {
      if (value === "none") {
        return {
          ...prev,
          allergyInfo: prev.allergyInfo.includes("none") ? [] : ["none"],
        };
      }

      const withoutNone = prev.allergyInfo.filter((item) => item !== "none");
      const exists = withoutNone.includes(value);
      return {
        ...prev,
        allergyInfo: exists
          ? withoutNone.filter((item) => item !== value)
          : [...withoutNone, value],
      };
    });
  };

  const handleSingleChoice = (
    field:
      | "ageRange"
      | "skinTone"
      | "eyeColor"
      | "hairColor"
      | "fragrancePref"
      | "budgetLevel"
      | "climate"
      | "routineFocus",
    value: string
  ) => {
    setFormState((prev) => ({
      ...prev,
      [field]: prev[field] === value ? "" : value,
    }));
  };

  const handleIntentSelect = (intentValue: string) => {
    const intent = SEARCH_INTENTS.find((item) => item.value === intentValue);
    if (!intent) return;
    setFormState((prev) => {
      const isActive = prev.searchIntent === intent.value;
      return {
        ...prev,
        searchIntent: isActive ? "" : intent.value,
        searchQuery: isActive ? "" : intent.query,
      };
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    const allergyList = formState.allergyInfo.includes("none")
      ? []
      : formState.allergyInfo;

    const payload: PersonalizedSearchPayload = {
      search_query: formState.searchQuery.trim() || undefined,
      user_email: userEmail || undefined,
      skin_profile: {
        skin_type: formState.skinType,
        skin_concerns: formState.skinConcerns,
        age_range: formState.ageRange || undefined,
        skin_tone: formState.skinTone || undefined,
        hair_color: formState.hairColor || undefined,
        eye_color: formState.eyeColor || undefined,
        fragrance_pref: formState.fragrancePref || undefined,
        allergy_info: allergyList.length ? allergyList.join(",") : undefined,
        budget_level: formState.budgetLevel || undefined,
        climate: formState.climate || undefined,
        routine_focus: formState.routineFocus || undefined,
        save_profile: formState.saveProfile,
      },
    };

    try {
      const response = await personalizedSearch(payload);
      savePersonalizedResponse(response);
      router.push(`/search/personalized?session_id=${response.session_id}`);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tạo gợi ý. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 px-4 py-6">
      <div className="max-h-[95vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">Tìm kiếm sản phẩm cá nhân hóa</h2>
            <p className="text-sm text-gray-500">
              Chia sẻ thông tin làn da để SephoraAI đề xuất chính xác nhất.
            </p>
          </div>
          <button
            aria-label="Đóng"
            className="rounded-full p-2 transition hover:bg-gray-100"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-medium text-gray-700">
              Bạn đang tìm kiếm điều gì? *
            </label>
            <p className="mt-1 text-xs text-gray-500">
              Chọn 1 mục tiêu chính để SephoraAI hiển thị đúng nhóm sản phẩm.
            </p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {SEARCH_INTENTS.map((intent) => {
                const active = formState.searchIntent === intent.value;
                return (
                  <button
                    type="button"
                    key={intent.value}
                    onClick={() => handleIntentSelect(intent.value)}
                    className={`rounded-2xl border px-4 py-3 text-left transition ${
                      active
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-200 text-gray-700 hover:border-gray-400"
                    }`}
                  >
                    <p className="text-sm font-semibold">{intent.label}</p>
                    <p className="mt-1 text-xs opacity-80">{intent.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-700">Loại da *</label>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {SKIN_TYPES.map((type) => (
                  <button
                    type="button"
                    key={type.value}
                    onClick={() => setFormState((prev) => ({ ...prev, skinType: type.value }))}
                    className={`rounded-full border px-3 py-2 text-sm ${
                      formState.skinType === type.value
                        ? "border-black bg-black text-white"
                        : "border-gray-300 text-gray-700"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Độ tuổi (tùy chọn)
              </label>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {AGE_OPTIONS.map((age) => {
                  const active = formState.ageRange === age.value;
                  return (
                    <button
                      type="button"
                      key={age.value}
                      onClick={() => handleSingleChoice("ageRange", age.value)}
                      className={`rounded-full border px-3 py-2 text-sm ${
                        active
                          ? "border-black bg-black text-white"
                          : "border-gray-300 text-gray-700"
                      }`}
                    >
                      {age.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">
              Vấn đề da đang gặp phải * (chọn nhiều)
            </label>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {SKIN_CONCERNS.map((concern) => {
                const checked = formState.skinConcerns.includes(concern.value);
                return (
                  <button
                    type="button"
                    key={concern.value}
                    onClick={() => handleConcernToggle(concern.value)}
                    className={`rounded-xl border px-4 py-2 text-left text-sm ${
                      checked
                        ? "border-rose-500 bg-rose-500/10 text-rose-600"
                        : "border-gray-300 text-gray-700"
                    }`}
                  >
                    {concern.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Màu da</label>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {SKIN_TONES.map((tone) => {
                  const active = formState.skinTone === tone.value;
                  return (
                    <button
                      type="button"
                      key={tone.value}
                      onClick={() => handleSingleChoice("skinTone", tone.value)}
                      className={`rounded-full border px-3 py-2 text-sm ${
                        active
                          ? "border-gray-900 bg-gray-900 text-white"
                          : "border-gray-300 text-gray-700"
                      }`}
                    >
                      {tone.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Màu mắt</label>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {EYE_COLORS.map((color) => {
                  const active = formState.eyeColor === color.value;
                  return (
                    <button
                      type="button"
                      key={color.value}
                      onClick={() => handleSingleChoice("eyeColor", color.value)}
                      className={`rounded-full border px-3 py-2 text-sm ${
                        active
                          ? "border-gray-900 bg-gray-900 text-white"
                          : "border-gray-300 text-gray-700"
                      }`}
                    >
                      {color.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Màu tóc</label>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {HAIR_COLORS.map((color) => {
                  const active = formState.hairColor === color.value;
                  return (
                    <button
                      type="button"
                      key={color.value}
                      onClick={() => handleSingleChoice("hairColor", color.value)}
                      className={`rounded-full border px-3 py-2 text-sm ${
                        active
                          ? "border-gray-900 bg-gray-900 text-white"
                          : "border-gray-300 text-gray-700"
                      }`}
                    >
                      {color.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Thành phần muốn tránh
              </label>
              <div className="mt-3 grid gap-2">
                {ALLERGY_OPTIONS.map((option) => {
                  const active = formState.allergyInfo.includes(option.value);
                  return (
                    <button
                      type="button"
                      key={option.value}
                      onClick={() => handleAllergyToggle(option.value)}
                      className={`rounded-xl border px-4 py-2 text-left text-sm ${
                        active
                          ? "border-rose-500 bg-rose-500/10 text-rose-600"
                          : "border-gray-300 text-gray-700"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Sở thích mùi hương</label>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {FRAGRANCE_PREFS.map((pref) => {
                  const active = formState.fragrancePref === pref.value;
                  return (
                    <button
                      type="button"
                      key={pref.value}
                      onClick={() => handleSingleChoice("fragrancePref", pref.value)}
                      className={`rounded-full border px-3 py-2 text-sm ${
                        active
                          ? "border-gray-900 bg-gray-900 text-white"
                          : "border-gray-300 text-gray-700"
                      }`}
                    >
                      {pref.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Ngân sách dự kiến</label>
              <div className="mt-3 space-y-2">
                {BUDGET_OPTIONS.map((option) => {
                  const active = formState.budgetLevel === option.value;
                  return (
                    <button
                      type="button"
                      key={option.value}
                      onClick={() => handleSingleChoice("budgetLevel", option.value)}
                      className={`w-full rounded-xl border px-3 py-2 text-sm ${
                        active
                          ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                          : "border-gray-300 text-gray-700"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Khí hậu bạn thường gặp</label>
              <div className="mt-3 space-y-2">
                {CLIMATE_OPTIONS.map((option) => {
                  const active = formState.climate === option.value;
                  return (
                    <button
                      type="button"
                      key={option.value}
                      onClick={() => handleSingleChoice("climate", option.value)}
                      className={`w-full rounded-xl border px-3 py-2 text-sm ${
                        active
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-gray-300 text-gray-700"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Thói quen dưỡng da</label>
              <div className="mt-3 space-y-2">
                {ROUTINE_OPTIONS.map((option) => {
                  const active = formState.routineFocus === option.value;
                  return (
                    <button
                      type="button"
                      key={option.value}
                      onClick={() => handleSingleChoice("routineFocus", option.value)}
                      className={`w-full rounded-xl border px-3 py-2 text-sm ${
                        active
                          ? "border-purple-600 bg-purple-50 text-purple-700"
                          : "border-gray-300 text-gray-700"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {allowSaveProfile && (
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300"
                checked={formState.saveProfile}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, saveProfile: e.target.checked }))
                }
              />
              Lưu thông tin này vào tài khoản của tôi
            </label>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-xs text-gray-500">
              * Cần ít nhất loại da và một vấn đề để gợi ý chính xác.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                className="rounded-full border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={!canSubmit || isSubmitting}
                className={`rounded-full px-6 py-2 text-sm font-semibold text-white ${
                  canSubmit && !isSubmitting
                    ? "bg-black hover:bg-black/90"
                    : "bg-gray-400 cursor-not-allowed"
                }`}
              >
                {isSubmitting ? "Đang xử lý..." : "Nhận gợi ý ngay"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}


