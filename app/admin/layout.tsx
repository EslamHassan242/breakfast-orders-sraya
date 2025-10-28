"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const isAuth = localStorage.getItem("adminAuth");
    if (!isAuth) router.push("/admin/login");
    else setAuth(true);
  }, [router]);

  if (!auth) return <div>Loading...</div>;

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-gray-900 text-white p-4">
        <h2 className="text-xl font-bold mb-6">Admin Dashboard</h2>
        <ul className="space-y-3">
          <li><a href="/admin">Home</a></li>
          <li><a href="/admin/orders">Orders</a></li>
          <li><a href="/admin/menu">Menu</a></li>
          <li><a href="/admin/sellers">Sellers</a></li>
          <li><a href="/admin/users">Users</a></li>
          <li><a href="/admin/stats">Daily Summary</a></li>
          <li><button onClick={() => { localStorage.removeItem("adminAuth"); router.push("/admin/login"); }}>Logout</button></li>
        </ul>
      </aside>
      <main className="flex-1 p-6 bg-gray-100">{children}</main>
    </div>
  );
}
