"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });

    if (error) {
      setLoading(false);
      return setError(error.message);
    }

    const user = data.user;
    if (user?.user_metadata?.role !== "admin") {
      await supabase.auth.signOut();
      setLoading(false);
      return setError("You are not authorized as admin.");
    }

    localStorage.setItem("adminAuth", "true");
    router.push("/admin");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-2xl shadow-lg w-96 space-y-4"
      >
        <h1 className="text-2xl font-semibold text-center text-gray-800">
          Admin Login
        </h1>

        <input
          type="email"
          placeholder="Email"
          className="border border-gray-300 w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="border border-gray-300 w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white font-semibold py-2 rounded-md hover:bg-blue-700 transition"
        >
          {loading ? "Signing in..." : "Login"}
        </button>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      </form>
    </div>
  );
}
