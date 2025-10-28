"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";


export default function SellersAdmin() {
  const [sellers, setSellers] = useState<any[]>([]);

  async function loadSellers() {
    const { data } = await supabase
      .from("sellers")
      .select("id, name, votes(count)")
      .order("id");
    setSellers(data || []);
  }

  async function deleteSeller(id: number) {
    await supabase.from("sellers").delete().eq("id", id);
    loadSellers();
  }

  useEffect(() => { loadSellers(); }, []);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Sellers & Votes</h2>
      <table className="w-full bg-white">
        <thead><tr><th>ID</th><th>Name</th><th>Votes</th><th></th></tr></thead>
        <tbody>
          {sellers.map(s => (
            <tr key={s.id}>
              <td>{s.id}</td>
              <td>{s.name}</td>
              <td>{s.votes?.length || 0}</td>
              <td><button onClick={() => deleteSeller(s.id)} className="text-red-500">Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
