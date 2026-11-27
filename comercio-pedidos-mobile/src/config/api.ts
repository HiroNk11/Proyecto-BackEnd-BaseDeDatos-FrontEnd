export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL || "http://192.168.100.99:5272/api"
).replace(/\/$/, "");
