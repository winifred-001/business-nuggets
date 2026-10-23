export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://business-nuggets-api.onrender.com"
    : "http://localhost:3001");
