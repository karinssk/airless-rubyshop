export const getAdminAuthHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {};
  if (typeof window === "undefined") return headers;
  const token = window.localStorage.getItem("adminToken");
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};
