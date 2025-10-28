"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [authChecked, setAuthChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        router.replace("/admin/login");
        return;
      }

      // Check role from your users table
      const { data: userData, error } = await supabase
        .from("users")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (error || !userData || userData.role !== "admin") {
        router.replace("/admin/login");
        return;
      }

      setIsAdmin(true);
      setAuthChecked(true);
    }

    checkAuth();
  }, [router]);

  if (!authChecked) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!isAdmin) return null;

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
          <li>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                router.push("/admin/login");
              }}
              className="text-red-400 mt-4"
            >
              Logout
            </button>
          </li>
        </ul>
      </aside>
      <main className="flex-1 p-6 bg-gray-100">{children}</main>
    </div>
  );
}
