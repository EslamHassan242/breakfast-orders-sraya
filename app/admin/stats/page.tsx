"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";


export default function StatsAdmin() {
  const [summary, setSummary] = useState<any[]>([]);

  async function loadStats() {
    const { data } = await supabase.rpc("daily_sales_summary");
    setSummary(data || []);
  }

  useEffect(() => { loadStats(); }, []);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Daily Sales Summary</h2>
      <table className="w-full bg-white">
        <thead><tr><th>Date</th><th>Total Orders</th><th>Total Sales</th></tr></thead>
        <tbody>
          {summary.map((s, idx) => (
            <tr key={idx}>
              <td>{s.date}</td><td>{s.total_orders}</td><td>{s.total_sales}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
