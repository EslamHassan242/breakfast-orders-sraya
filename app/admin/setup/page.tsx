"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminSetup() {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const router = useRouter();

  const handleSetup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !pass) {
      alert("Please enter username and password");
      return;
    }
    localStorage.setItem("adminUser", user);
    localStorage.setItem("adminPass", pass);
    alert("Admin credentials saved! Redirecting to login...");
    router.push("/admin/login");
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Initial Admin Setup</h1>
      <form onSubmit={handleSetup} className="space-y-3">
        <input
          type="text"
          placeholder="Admin username"
          value={user}
          onChange={(e) => setUser(e.target.value)}
          className="border w-full p-2 rounded"
        />
        <input
          type="password"
          placeholder="Admin password"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          className="border w-full p-2 rounded"
        />
        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">
          Save
        </button>
      </form>
    </div>
  );
}
