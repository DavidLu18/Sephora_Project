"use client";

import { useEffect, useState, ChangeEvent, FormEvent } from "react";
import { Address } from "@/types/address";
import {
  getAddresses,
  createAddress,
  setDefaultAddress,
  deleteAddress,
  getCities, getWards 
} from "@/api/index";

interface AddressForm {
  country: string;
  city: string;
  district: string;
  street: string;
  zipcode: string;
  isdefault: boolean;
  cityCode?: string;  
  wardCode?: string;
}
interface City {
  code: number;
  name: string;
}

interface Ward {
  code: number;
  name: string;
}
export default function AddressPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [form, setForm] = useState<AddressForm>({
    country: "",
    city: "",
    district: "",
    cityCode: "",
    wardCode: "",
    street: "",
    zipcode: "",
    isdefault: false,
  });

  // ====== LOAD ADDRESS LIST ======
  const loadAddresses = async () => {
    try {
      const data = await getAddresses();
      setAddresses(data);
    } catch (err) {
      console.error("Lỗi load địa chỉ:", err);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);
    useEffect(() => {
    if (showForm) {
      (async () => {
        const cityList = await getCities();
        setCities(cityList);
      })();
    }
  }, [showForm]);
  // ====== HANDLE INPUT ======
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const target = e.target;
    const { name, value } = target;

    if (name === "city") {
      const selectedCity = cities.find((c) => String(c.code) === value);

      setForm((prev) => ({
        ...prev,
        cityCode: value,               // dropdown dùng CODE
        city: selectedCity?.name || "", // API dùng NAME
        district: "",
        wardCode: "",
        country: "Việt Nam",
      }));

      // DÙNG IIFE ĐỂ DÙNG AWAIT TRONG HÀM KHÔNG ASYNC
      (async () => {
        const wardList = await getWards(value);
        setWards(wardList);
      })();

      return;
    }



    // Khi chọn PHƯỜNG/XÃ → lưu TÊN phường/xã
    if (name === "district") {
      const selectedWard = wards.find((w) => String(w.code) === value);

      setForm((prev) => ({
        ...prev,
        wardCode: value,                // dropdown dùng CODE
        district: selectedWard?.name || "", // API dùng NAME
        country: "Việt Nam",
      }));
      return;
    }

    // Input khác
    setForm((prev) => ({
      ...prev,
      [name]: value,
      country: "Việt Nam",
    }));
  };



  // ====== SUBMIT NEW ADDRESS ======
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      await createAddress(form);

      setShowForm(false);
      setForm({
        country: "",
        city: "",
        district: "",
        street: "",
        zipcode: "",
        isdefault: false,
      });

      loadAddresses();
    } catch (err) {
      alert("Không thể thêm địa chỉ");
      console.error(err);
    }
  };

  // ====== SET DEFAULT ======
  const handleSetDefault = async (id: number) => {
    await setDefaultAddress(id);
    loadAddresses();
  };

  // ====== DELETE ADDRESS ======
  const handleDelete = async (id: number) => {
    if (!confirm("Xóa địa chỉ này?")) return;

    await deleteAddress(id);
    loadAddresses();
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Địa chỉ của tôi</h1>

      {/* FORM THÊM */}
      {showForm && (
        <div className="border rounded-xl p-6 space-y-4 mt-6">
          <h2 className="text-xl font-semibold">Thêm địa chỉ mới</h2>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* CITY DROPDOWN */}
          <select
            name="city"
            value={form.cityCode}
            onChange={handleChange}
            className="border p-3 rounded-xl"
            required
          >
            <option value="">-- Chọn thành phố --</option>
            {cities.map((c) => (
              <option key={c.code} value={String(c.code)}>
                {c.name}
              </option>
            ))}
          </select>



          {/* WARD DROPDOWN */}
          <select
            name="district"
            value={form.wardCode}
            onChange={handleChange}
            className="border p-3 rounded-xl"
            required
            disabled={!form.cityCode}
          >
            <option value="">-- Chọn phường/xã --</option>
            {wards.map((w) => (
              <option key={w.code} value={String(w.code)}>
                {w.name}
              </option>
            ))}
          </select>


          <input
            name="street"
            placeholder="Địa chỉ (Số nhà, tên đường)"
            value={form.street}
            onChange={handleChange}
            className="border p-3 rounded-xl md:col-span-2"
          />

          

          <label className="flex items-center gap-2 md:col-span-2">
            <input
              type="checkbox"
              name="isdefault"
              checked={form.isdefault}
              onChange={handleChange}
            />
            Đặt làm địa chỉ mặc định
          </label>

          <button
            type="submit"
            className="bg-black text-white py-3 rounded-xl md:col-span-2 hover:bg-gray-800 transition"
          >
            Lưu địa chỉ
          </button>

        </form>

        </div>
      )}
      {/* NÚT THÊM ĐỊA CHỈ */}
      <button
        onClick={() => setShowForm((prev) => !prev)}
        className="bg-black text-white py-3 px-6 rounded-xl hover:bg-gray-800 transition"
      >
        {showForm ? "Đóng" : "+ Thêm địa chỉ mới"}
      </button>

      {/* DANH SÁCH ĐỊA CHỈ */}
      <div className="space-y-4">
        {addresses.map((item) => (
          <div
            key={item.addressid}
            className="border rounded-xl p-4 flex flex-col md:flex-row justify-between gap-3"
          >
            <div className="space-y-1">
              <p className="font-semibold">{item.street || "Không có tên đường"}</p>
              <p className="text-sm text-gray-600">
                {item.district}, {item.city}
              </p>
              <p className="text-sm">{item.country}</p>

              {item.isdefault && (
                <span className="text-xs bg-black text-white px-2 py-1 rounded-lg inline-block mt-2">
                  Địa chỉ mặc định
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-sm">
              {!item.isdefault && (
                <button
                  className="underline text-black"
                  onClick={() => handleSetDefault(item.addressid)}
                >
                  Đặt mặc định
                </button>
              )}

              <button
                className="underline text-red-500"
                onClick={() => handleDelete(item.addressid)}
              >
                Xóa
              </button>
            </div>
          </div>
        ))}
      </div>

      
      
    </div>
  );
}
