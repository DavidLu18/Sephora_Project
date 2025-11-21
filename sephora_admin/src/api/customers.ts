import { fetchJSON } from "./index";
import { Customer, CustomerDetail } from "@/types/customer";

export const customersApi = {
  getAll: async (query = ""): Promise<{ results: Customer[] }> => {
    return fetchJSON(`/users/admin/customers/${query}`);
  },

  getOne: async (id: number): Promise<CustomerDetail> => {
    return fetchJSON(`/users/admin/customers/${id}/`);
  },

  toggle: async (
    id: number,
    active: boolean
  ): Promise<{ message: string; is_active: boolean }> => {
    return fetchJSON(`/users/admin/customers/${id}/toggle-block/`, {
      method: "PATCH",
      body: JSON.stringify({ active }),
    });
  },
};
