"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { ScanLine, Menu, X, LogOut } from "lucide-react";
import { getToken, clearToken } from "@/lib/api";

const AuthModal = dynamic(() => import("@/components/auth/AuthModal"), { ssr: false });

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [loggedIn, setLoggedIn] = useState(false);
  const [userName, setUserName] = useState("User");

  useEffect(() => {
    const token = getToken();
    setLoggedIn(!!token);
    const stored = localStorage.getItem("user_name");
    if (stored) setUserName(stored);

    const params = new URLSearchParams(window.location.search);
    if (params.get("auth") === "login") {
      setAuthMode("login");
      setAuthOpen(true);
    } else if (params.get("auth") === "signup") {
      setAuthMode("signup");
      setAuthOpen(true);
    }
  }, [pathname]);

  const openAuth = (mode: "login" | "signup") => {
    setAuthMode(mode);
    setAuthOpen(true);
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    clearToken();
    localStorage.removeItem("user_name");
    setLoggedIn(false);
    setMobileMenuOpen(false);
    router.push("/");
  };

  return (
    <>
      <nav className="w-full bg-gray-50 border-b border-gray-200 relative z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-20 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 no-underline" onClick={() => setMobileMenuOpen(false)}>
              <span className="bg-amber-400 p-2 sm:p-2.5 rounded-lg flex items-center justify-center shrink-0">
                <ScanLine color="black" size={22} strokeWidth={2.2} />
              </span>
              <span className="font-bold text-xl sm:text-2xl text-gray-900 whitespace-nowrap">
                Compliance Checker
              </span>
            </Link>

            <div className="hidden lg:flex items-center gap-7 xl:gap-9">
              <Link href="/" className={`relative text-sm xl:text-base font-medium no-underline py-2 transition-colors duration-200 ${pathname === "/" ? "text-gray-900" : "text-gray-600 hover:text-gray-900"}`}>
                Home
                {pathname === "/" && <span className="absolute left-0 right-0 -bottom-1 h-0.5 bg-amber-400 rounded-full" />}
              </Link>
              <Link href="/guidelines" className={`relative text-sm xl:text-base font-medium no-underline py-2 transition-colors duration-200 ${pathname === "/guidelines" ? "text-gray-900" : "text-gray-600 hover:text-gray-900"}`}>
                Guidelines
                {pathname === "/guidelines" && <span className="absolute left-0 right-0 -bottom-1 h-0.5 bg-amber-400 rounded-full" />}
              </Link>
              <Link href="/dashboard" className={`relative text-sm xl:text-base font-medium no-underline py-2 transition-colors duration-200 ${pathname === "/dashboard" ? "text-gray-900" : "text-gray-600 hover:text-gray-900"}`}>
                Dashboard
                {pathname === "/dashboard" && <span className="absolute left-0 right-0 -bottom-1 h-0.5 bg-amber-400 rounded-full" />}
              </Link>
              <Link href="/dashboard/maps" className={`relative text-sm xl:text-base font-medium no-underline py-2 transition-colors duration-200 ${pathname === "/dashboard/maps" ? "text-gray-900" : "text-gray-600 hover:text-gray-900"}`}>
                Maps
                {pathname === "/dashboard/maps" && <span className="absolute left-0 right-0 -bottom-1 h-0.5 bg-amber-400 rounded-full" />}
              </Link>
              <Link href="/dashboard/inspections" className={`relative text-sm xl:text-base font-medium no-underline py-2 transition-colors duration-200 ${pathname === "/dashboard/inspections" ? "text-gray-900" : "text-gray-600 hover:text-gray-900"}`}>
                Inspections
                {pathname === "/dashboard/inspections" && <span className="absolute left-0 right-0 -bottom-1 h-0.5 bg-amber-400 rounded-full" />}
              </Link>
              <Link href="/dashboard/history" className={`relative text-sm xl:text-base font-medium no-underline py-2 transition-colors duration-200 ${pathname === "/dashboard/history" ? "text-gray-900" : "text-gray-600 hover:text-gray-900"}`}>
                History
                {pathname === "/dashboard/history" && <span className="absolute left-0 right-0 -bottom-1 h-0.5 bg-amber-400 rounded-full" />}
              </Link>

              {loggedIn ? (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-xs font-bold">
                      {userName.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{userName}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <button onClick={() => openAuth("login")} className="text-sm xl:text-base text-gray-700 font-medium hover:text-gray-900 transition-colors duration-200">
                    Login
                  </button>
                  <button onClick={() => openAuth("signup")} className="bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-black font-semibold text-sm xl:text-base px-5 py-2.5 rounded-lg transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                    Get Started
                  </button>
                </>
              )}
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden flex items-center justify-center w-11 h-11 rounded-lg bg-white border border-gray-200 text-gray-800 hover:bg-gray-100 transition-colors duration-200"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={25} /> : <Menu size={25} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-gray-50 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
              <div className="flex flex-col gap-1">
                <Link href="/" onClick={() => setMobileMenuOpen(false)} className={`flex items-center justify-between w-full px-4 py-3 rounded-lg no-underline text-base font-medium transition-colors duration-200 ${pathname === "/" ? "bg-amber-100 text-gray-900" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"}`}>
                  <span>Home</span>
                  {pathname === "/" && <span className="w-2 h-2 bg-amber-400 rounded-full" />}
                </Link>
                <Link href="/guidelines" onClick={() => setMobileMenuOpen(false)} className={`flex items-center justify-between w-full px-4 py-3 rounded-lg no-underline text-base font-medium transition-colors duration-200 ${pathname === "/guidelines" ? "bg-amber-100 text-gray-900" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"}`}>
                  <span>Guidelines</span>
                  {pathname === "/guidelines" && <span className="w-2 h-2 bg-amber-400 rounded-full" />}
                </Link>
                <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className={`flex items-center justify-between w-full px-4 py-3 rounded-lg no-underline text-base font-medium transition-colors duration-200 ${pathname === "/dashboard" ? "bg-amber-100 text-gray-900" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"}`}>
                  <span>Dashboard</span>
                  {pathname === "/dashboard" && <span className="w-2 h-2 bg-amber-400 rounded-full" />}
                </Link>
                <Link href="/dashboard/maps" onClick={() => setMobileMenuOpen(false)} className={`flex items-center justify-between w-full px-4 py-3 rounded-lg no-underline text-base font-medium transition-colors duration-200 ${pathname === "/dashboard/maps" ? "bg-amber-100 text-gray-900" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"}`}>
                  <span>Maps</span>
                  {pathname === "/dashboard/maps" && <span className="w-2 h-2 bg-amber-400 rounded-full" />}
                </Link>
                <Link href="/dashboard/inspections" onClick={() => setMobileMenuOpen(false)} className={`flex items-center justify-between w-full px-4 py-3 rounded-lg no-underline text-base font-medium transition-colors duration-200 ${pathname === "/dashboard/inspections" ? "bg-amber-100 text-gray-900" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"}`}>
                  <span>Inspections</span>
                  {pathname === "/dashboard/inspections" && <span className="w-2 h-2 bg-amber-400 rounded-full" />}
                </Link>
                <Link href="/dashboard/history" onClick={() => setMobileMenuOpen(false)} className={`flex items-center justify-between w-full px-4 py-3 rounded-lg no-underline text-base font-medium transition-colors duration-200 ${pathname === "/dashboard/history" ? "bg-amber-100 text-gray-900" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"}`}>
                  <span>History</span>
                  {pathname === "/dashboard/history" && <span className="w-2 h-2 bg-amber-400 rounded-full" />}
                </Link>
                <div className="h-px bg-gray-200 my-3" />
                {loggedIn ? (
                  <>
                    <div className="flex items-center gap-3 px-4 py-2">
                      <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-xs font-bold">
                        {userName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{userName}</span>
                    </div>
                    <button onClick={handleLogout} className="w-full text-left px-4 py-3 rounded-lg text-base font-medium text-red-500 hover:bg-red-50 transition-colors duration-200">
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => openAuth("login")} className="w-full text-left px-4 py-3 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-200">
                      Login
                    </button>
                    <button onClick={() => openAuth("signup")} className="w-full mt-2 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-black font-semibold px-5 py-3 rounded-lg transition-all duration-200 hover:shadow-md text-center">
                      Get Started
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} initialMode={authMode} />
    </>
  );
}
