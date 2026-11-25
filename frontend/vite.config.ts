import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // During development, forward API calls to the FastAPI backend (fastapi dev app/main.py).
    proxy: {
      "/api": "http://localhost:8000",
    },
  },
});
