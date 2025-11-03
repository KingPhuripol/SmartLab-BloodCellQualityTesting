"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

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
        setError("Invalid credentials. Try the demo accounts below.");
        return;
      }

      // Store session in localStorage (demo only)
      const session = {
        token: "demo-token",
        user: { email, role: match.role, name: match.role },
        signedInAt: Date.now(),
      };
      if (typeof window !== "undefined") {
        localStorage.setItem("smartlab_auth", JSON.stringify(session));
      }

      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = () => {
    if (typeof window !== "undefined") {
      const session = {
        token: "guest-token",
        user: { email: "guest@smartlab.local", role: "Guest", name: "Guest" },
        signedInAt: Date.now(),
      };
      localStorage.setItem("smartlab_auth", JSON.stringify(session));
    }
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-900 font-semibold">
            <ShieldCheck className="h-5 w-5 text-blue-600" /> SmartLab Access
          </div>
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
            Back to Home
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="bg-white rounded-lg border p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-gray-900">Sign in</h1>
          <p className="text-sm text-gray-600 mt-1">
            Use a demo account or continue as guest.
          </p>

          {error && (
            <div className="mt-3 p-3 rounded-md bg-red-50 text-red-700 border border-red-200 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="mt-4 space-y-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Email</label>
              <input
                type="email"
                className="w-full border rounded-md px-3 py-2 text-sm"
                placeholder="e.g. admin@smartlab.local"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                className="w-full border rounded-md px-3 py-2 text-sm"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <button
            onClick={handleGuest}
            className="w-full mt-3 px-4 py-2 bg-white text-gray-700 border rounded-md hover:bg-gray-50"
          >
            Continue as Guest
          </button>
        </section>

        <aside className="bg-white rounded-lg border p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">Demo accounts</h2>
          <ul className="mt-2 text-sm text-gray-700 space-y-1">
            <li>
              <span className="font-medium">Administrator:</span>{" "}
              admin@smartlab.local / admin123
            </li>
            <li>
              <span className="font-medium">Supervisor:</span>{" "}
              supervisor@smartlab.local / super123
            </li>
            <li>
              <span className="font-medium">Analyst:</span>{" "}
              analyst@smartlab.local / analyst123
            </li>
          </ul>
          <div className="mt-4 text-xs text-gray-500">
            This is a client-side demo login (no backend). Replace with your
            identity provider or API when ready.
          </div>
        </aside>
      </main>
    </div>
  );
}
