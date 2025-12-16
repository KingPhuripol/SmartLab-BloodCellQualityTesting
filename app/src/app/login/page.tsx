"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Simple client-side demo auth (no backend required)
    // Accepts three roles with default passwords; otherwise show error.
    const demoUsers = {
      admin: {
        email: "admin@smartlab.local",
        password: "admin123",
        role: "Administrator",
      },
      supervisor: {
        email: "supervisor@smartlab.local",
        password: "super123",
        role: "Supervisor",
      },
      analyst: {
        email: "analyst@smartlab.local",
        password: "analyst123",
        role: "Analyst",
      },
    } as const;

    setLoading(true);
    try {
      const match = Object.values(demoUsers).find(
        (u) => u.email === email && u.password === password
      );

      if (!match) {
        setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง (Invalid credentials)");
        setLoading(false);
        return;
      }

      // Store session in localStorage (demo only)
      localStorage.setItem("user_session", JSON.stringify(match));

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      router.push("/dashboard");
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-blue-600 p-3 rounded-xl shadow-lg">
            <ShieldCheck className="h-10 w-10 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-slate-900">
          เข้าสู่ระบบ SmartLab
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          ระบบบริหารคุณภาพห้องปฏิบัติการ (Quality Management System)
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-slate-200">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700"
              >
                อีเมล (Email address)
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 appearance-none rounded-md border border-slate-300 px-3 py-2 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  placeholder="name@hospital.com"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700"
              >
                รหัสผ่าน (Password)
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 appearance-none rounded-md border border-slate-300 px-3 py-2 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle
                      className="h-5 w-5 text-red-400"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      เข้าสู่ระบบไม่สำเร็จ
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ (Sign in)"}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-slate-500">
                  บัญชีทดสอบ (Demo Accounts)
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3">
              <button
                type="button"
                onClick={() => {
                  setEmail("admin@smartlab.local");
                  setPassword("admin123");
                }}
                className="inline-flex w-full justify-between items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-500 shadow-sm hover:bg-slate-50"
              >
                <span className="flex items-center">
                  <span className="h-2 w-2 rounded-full bg-purple-500 mr-2"></span>
                  Admin
                </span>
                <span className="text-xs text-slate-400">admin123</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail("analyst@smartlab.local");
                  setPassword("analyst123");
                }}
                className="inline-flex w-full justify-between items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-500 shadow-sm hover:bg-slate-50"
              >
                <span className="flex items-center">
                  <span className="h-2 w-2 rounded-full bg-blue-500 mr-2"></span>
                  Analyst
                </span>
                <span className="text-xs text-slate-400">analyst123</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
