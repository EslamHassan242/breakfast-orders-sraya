"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AdminDashboard() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [menu, setMenu] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [summary, setSummary] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    verifySession();
  }, []);

  async function verifySession() {
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (!user || user.user_metadata.role !== "admin") {
      router.push("/admin/login");
    } else {
      setSession(user);
      await loadData();
      setLoading(false);
    }
  }

  async function loadData() {
    const { data: menu } = await supabase.from("menu").select("*");
    const { data: orders } = await supabase.from("orders").select("*");
    setMenu(menu || []);
    setOrders(orders || []);

    const map: Record<string, number> = {};
    orders?.forEach((o) =>
      o.items.forEach((it: any) => {
        map[it.name] = (map[it.name] || 0) + it.qty;
      })
    );

    setSummary(
      Object.entries(map).map(([name, qty], i) => ({ id: i + 1, name, qty }))
    );
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/admin/login");
  }

  async function deleteOrder(id: number) {
    await supabase.from("orders").delete().eq("id", id);
    loadData();
  }

  async function deleteMenuItem(id: number) {
    await supabase.from("menu").delete().eq("id", id);
    loadData();
  }

  if (loading) return <p className="text-center mt-20">Loading...</p>;

  return (
    <div className="p-8 bg-gray-50 min-h-screen space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <button
          onClick={logout}
          className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
        >
          Logout
        </button>
      </div>

      {/* Menu Management */}
      <section className="bg-white p-6 rounded-xl shadow space-y-3">
        <h2 className="text-xl font-semibold">Menu Management</h2>
        <table className="w-full border-collapse border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">Name</th>
              <th className="p-2">Price</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {menu.map((m) => (
              <tr key={m.id}>
                <td className="p-2">{m.name}</td>
                <td className="p-2">{m.price}</td>
                <td className="p-2 text-center">
                  <button
                    onClick={() => deleteMenuItem(m.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Orders */}
      <section className="bg-white p-6 rounded-xl shadow space-y-3">
        <h2 className="text-xl font-semibold">Orders</h2>
        {orders.map((o) => (
          <div key={o.id} className="border-b border-gray-200 pb-2 mb-2">
            <div className="flex justify-between">
              <strong>{o.customer}</strong>
              <small>{new Date(o.created_at).toLocaleTimeString()}</small>
            </div>
            <div>
              {o.items.map((it: any) => (
                <div key={it.id}>
                  {it.name} × {it.qty}
                </div>
              ))}
            </div>
            <button
              className="text-red-500 mt-1"
              onClick={() => deleteOrder(o.id)}
            >
              Delete
            </button>
          </div>
        ))}
      </section>

      {/* Summary */}
      <section className="bg-white p-6 rounded-xl shadow space-y-3">
        <h2 className="text-xl font-semibold">Today's Summary</h2>
        <table className="w-full border-collapse border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">Item</th>
              <th className="p-2">Qty</th>
            </tr>
          </thead>
          <tbody>
            {summary.map((s) => (
              <tr key={s.id}>
                <td className="p-2">{s.name}</td>
                <td className="p-2">{s.qty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
