"use client";

import { ThemeProvider } from "./components/providers/ThemeProvider";
import EnhancedNavbar from "./components/EnhancedNavbar";
import EnhancedHome from "./components/pages/EnhancedHome";
import Footer from "./components/Footer";

export default function EnhancedPage() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-[color:var(--bg)]">
        <EnhancedNavbar />
        <EnhancedHome />
        <Footer />
      </div>
    </ThemeProvider>
  );
}
