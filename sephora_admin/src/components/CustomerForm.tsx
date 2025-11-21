"use client";

import { CustomerDetail } from "@/types/customer";

export default function CustomerFormView({ data }: { data: CustomerDetail }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* LEFT 2 columns */}
      <div className="lg:col-span-2 bg-[#111] border border-gray-800 rounded-2xl p-6 space-y-8 shadow-xl">

        {/* SECTION: THÔNG TIN CÁ NHÂN */}
        <Section title="Thông tin cá nhân">
          <Input label="Họ" value={data.firstname} />
          <Input label="Tên" value={data.lastname} />
          <Input label="Email" value={data.email} />
          <Input label="Số điện thoại" value={data.phone ?? ""} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Giới tính" value={data.gender ?? ""} />
            <Input label="Ngày sinh" value={data.dateofbirth ?? ""} />
          </div>
        </Section>

        {/* SECTION: THÔNG TIN DA */}
        <Section title="Thông tin da">
          <Input label="Loại da" value={data.skintype ?? ""} />
          <Textarea label="Vấn đề da" value={data.skinconcerns ?? ""} />

          <Input label="Độ tuổi" value={data.agerange ?? ""} />
        </Section>
      </div>

      {/* RIGHT 1 column */}
      <div className="bg-[#111] border border-gray-800 rounded-2xl p-6 space-y-8 shadow-xl">
        <Section title="Đặc điểm cơ thể & sở thích">
          <Input label="Màu da" value={data.skin_tone ?? ""} />
          <Input label="Màu tóc" value={data.hair_color ?? ""} />
          <Input label="Màu mắt" value={data.eye_color ?? ""} />
          <Input label="Sở thích mùi hương" value={data.fragrance_pref ?? ""} />
          <Textarea label="Dị ứng" value={data.allergy_info ?? ""} />
        </Section>
      </div>
    </div>
  );
}

/* ---------------- COMPONENTS ---------------- */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-200 mb-4">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Input({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="label-sephora">{label}</label>
      <input
        disabled
        value={value}
        className="input-sephora bg-white text-black rounded-lg"
      />
    </div>
  );
}

function Textarea({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="label-sephora">{label}</label>
      <textarea
        rows={3}
        disabled
        value={value}
        className="textarea-sephora bg-white text-black rounded-lg"
      ></textarea>
    </div>
  );
}
