"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";


export default function OrdersAdmin() {
  const [orders, setOrders] = useState<any[]>([]);

  async function loadOrders() {
    const { data, error } = await supabase.from("orders").select("*");
    if (error) console.error(error);
    else setOrders(data);
  }

  async function deleteOrder(id: number) {
    await supabase.from("orders").delete().eq("id", id);
    loadOrders();
  }

  useEffect(() => { loadOrders(); }, []);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Manage Orders</h2>
      <table className="w-full bg-white shadow rounded">
        <thead>
          <tr className="bg-gray-200">
            <th>ID</th><th>Customer</th><th>Total</th><th>Date</th><th></th>
          </tr>
        </thead>
        <tbody>
          {orders.map(o => (
            <tr key={o.id} className="border-t">
              <td>{o.id}</td>
              <td>{o.customer_name}</td>
              <td>{o.total}</td>
              <td>{new Date(o.created_at).toLocaleString()}</td>
              <td><button onClick={() => deleteOrder(o.id)} className="text-red-500">Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
