"use client";

import { useState } from "react";
import { Eye, EyeOff, X } from "lucide-react";
import { apiFetch, setToken } from "@/lib/api";
import { useRouter } from "next/navigation";

type AuthMode = "login" | "signup";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
}

export default function AuthModal({ isOpen, onClose, initialMode = "login" }: AuthModalProps) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setName("");
    setContact("");
    setRememberMe(true);
    setShowPassword(false);
    setError(null);
  };

  const switchMode = (newMode: AuthMode) => {
    resetForm();
    setMode(newMode);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setToken(data.token);
      localStorage.setItem("user_name", data.user.name);
      handleClose();
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });
      setToken(data.token);
      localStorage.setItem("user_name", data.user.name);
      handleClose();
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <section className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 font-sans px-4 sm:px-6 py-6 sm:py-10 overflow-y-auto">
      <div className={`relative w-full ${mode === "login" ? "max-w-5xl" : "max-w-4xl"} rounded-2xl sm:rounded-3xl bg-white shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2 my-auto`}>
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 z-20 w-9 h-9 flex items-center justify-center rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          aria-label="Close"
        >
          <X size={21} />
        </button>

        {/* Left panel - Image */}
        <div className="hidden lg:block relative min-h-[480px]">
          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTS3s45J-kQm6Yg9pymr8XySIaewEql0qKS_HoRlg2xsg&s=10"
            alt="Compliance"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/10" />
        </div>

        {/* Right panel - Form */}
        <div className="relative flex flex-col justify-center px-6 py-10 sm:px-10 sm:py-12 lg:px-12 lg:py-14">
          {loading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm rounded-r-2xl sm:rounded-r-3xl">
              <div className="w-8 h-8 border-3 border-orange-200 border-t-orange-600 rounded-full animate-spin" />
              <p className="mt-3 text-sm text-neutral-500 font-medium">
                {mode === "login" ? "Logging in..." : "Creating account..."}
              </p>
            </div>
          )}
          <div className="mb-7 sm:mb-8">
            <p className="font-bold text-lg text-neutral-900">Compliance Checker</p>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">
            {mode === "login" ? "Welcome Back!" : "Create Account"}
          </h1>

          <p className="text-sm text-neutral-400 mt-1 mb-7 sm:mb-8">
            Enter your details below
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-5">
              {error}
            </div>
          )}

          {mode === "login" ? (
            <form onSubmit={handleLogin} className="space-y-5 sm:space-y-6">
              <div>
                <label className="block text-sm text-neutral-600 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="hello.alex@gmail.com"
                  className="w-full pb-2 text-sm text-neutral-800 placeholder:text-neutral-400 bg-transparent border-b border-neutral-200 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm text-neutral-600 mb-1">Password</label>
                <div className="flex items-center border-b border-neutral-200 focus-within:border-orange-500 transition-colors">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pb-2 text-sm text-neutral-800 bg-transparent focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-neutral-400 hover:text-neutral-600 pb-2 pl-2 cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 text-xs sm:text-sm">
                <label className="flex items-center gap-2 text-neutral-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={() => setRememberMe(!rememberMe)}
                    className="accent-orange-600 w-4 h-4 rounded cursor-pointer"
                  />
                  <span>Remember me</span>
                </label>
                <button type="button" className="text-neutral-400 hover:text-neutral-600 bg-transparent border-0 p-0 cursor-pointer whitespace-nowrap">
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-neutral-900 text-white py-3 sm:py-3.5 text-sm font-semibold hover:bg-neutral-800 active:bg-neutral-950 transition-colors cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                ) : (
                  "Log in"
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="text-sm text-neutral-600">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Alex Johnson"
                  className="w-full mt-1 pb-1.5 text-sm text-neutral-800 placeholder:text-neutral-400 bg-transparent border-b border-neutral-200 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-sm text-neutral-600">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="hello.alex@gmail.com"
                  className="w-full mt-1 pb-1.5 text-sm text-neutral-800 placeholder:text-neutral-400 bg-transparent border-b border-neutral-200 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-sm text-neutral-600">Contact number</label>
                <input
                  type="tel"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full mt-1 pb-1.5 text-sm text-neutral-800 placeholder:text-neutral-400 bg-transparent border-b border-neutral-200 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-sm text-neutral-600">Password</label>
                <div className="flex items-center justify-between border-b border-neutral-200 focus-within:border-orange-500 transition-colors">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full mt-1 pb-1.5 text-sm text-neutral-800 bg-transparent focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-neutral-400 hover:text-neutral-600 active:scale-90 transition-all pb-1.5"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-neutral-900 text-white py-2.5 text-sm font-semibold hover:bg-neutral-800 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                ) : (
                  "Sign up"
                )}
              </button>
            </form>
          )}

          <p className="text-center text-sm text-neutral-400 mt-7 sm:mt-8">
            {mode === "login" ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("signup")}
                  className="text-neutral-900 font-semibold bg-transparent border-0 p-0 cursor-pointer hover:underline"
                >
                  Sign Up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <span
                  onClick={() => switchMode("login")}
                  className="text-neutral-900 font-semibold cursor-pointer active:scale-95 inline-block transition-transform"
                >
                  Log in
                </span>
              </>
            )}
          </p>
        </div>
      </div>
    </section>
  );
}
