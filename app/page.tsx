"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
// Utility
function currency(n: number) {
  return `$${n.toFixed(2)}`;
}

export default function Home() {
  const [menu, setMenu] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [qty, setQty] = useState(1);
  const [order, setOrder] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [customer, setCustomer] = useState("");
  const [todayOrders, setTodayOrders] = useState<any[]>([]);
  const [todaySummary, setTodaySummary] = useState<any[]>([]);
  const [note, setNote] = useState("");

  // voting states
  const [sellers, setSellers] = useState<any[]>([]);
  const [voteCounts, setVoteCounts] = useState<Record<number, number>>({});
  const [selectedSeller, setSelectedSeller] = useState<number | null>(null);
  const [votedToday, setVotedToday] = useState(false);
  const [loadingVotes, setLoadingVotes] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem("adminAuth");
    setIsAdmin(!!auth);
  }, []);


  useEffect(() => {
    loadMenu();
    loadToday();
    loadSellersAndVotes();
  }, []);

  // --- MENU + ORDERS ---
  async function loadMenu() {
    const { data, error } = await supabase.from("menu").select("*").order("id");
    if (error || !data) {
      console.error("Menu load failed:", error);
      const fallback = [
        { id: 1, name: "فول", price: 1.5 },
        { id: 2, name: "طعمية", price: 1.25 },
        { id: 3, name: "بيض", price: 2.5 },
        { id: 4, name: "جبنة", price: 1.0 },
      ];
      setMenu(fallback);
      setSelectedId(String(fallback[0].id));
    } else {
      setMenu(data);
      if (data.length) setSelectedId(String(data[0].id));
    }
  }

  async function saveOrder() {
    if (!customer.trim()) return alert("Please enter your name.");
    if (order.length === 0) return alert("No items selected.");

    setSaving(true);
    try {
      const { error } = await supabase.from("orders").insert([
        {
          customer,
          items: order,
          total: total(),
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;
      setOrder([]);
      await loadToday();
    } catch (err) {
      console.error("Save failed:", err);
      alert("Failed to save order.");
    } finally {
      setSaving(false);
    }
  }

  async function loadToday() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .gte("created_at", start.toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setTodayOrders(data || []);

    const map: Record<string, number> = {};
    data?.forEach((o) =>
      o.items.forEach((it: any) => {
        map[it.name] = (map[it.name] || 0) + it.qty;
      })
    );

    setTodaySummary(
      Object.entries(map).map(([name, qty], i) => ({ id: i + 1, name, qty }))
    );
  }

  function addItem() {
    const item = menu.find((m) => String(m.id) === selectedId);
    if (!item) return;
    const q = Math.max(1, Number(qty) || 1);
    const trimmedNote = note.trim();
    setOrder((prev) => {
      const exists = prev.find(
        (p) => p.id === item.id && (p.note || "") === trimmedNote
      );
      if (exists)
        return prev.map((p) =>
          p.id === item.id && (p.note || "") === trimmedNote
            ? { ...p, qty: p.qty + q }
            : p
        );
      return [
        ...prev,
        {
          id: item.id,
          name: item.name,
          price: item.price,
          qty: q,
          note: trimmedNote,
        },
      ];
    });
    setNote("");
  }

  function removeItem(id: number) {
    setOrder((prev) => prev.filter((p) => p.id !== id));
  }

  function total() {
    return order.reduce((s, o) => s + o.price * o.qty, 0);
  }

  // --- VOTING LOGIC ---
  async function loadSellersAndVotes() {
    setLoadingVotes(true);
    const { data: sellersData } = await supabase.from("sellers").select("*");
    setSellers(sellersData || []);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { data: votesData } = await supabase
      .from("votes")
      .select("seller_id")
      .gte("created_at", today.toISOString());

    const counts: Record<number, number> = {};
    votesData?.forEach((v) => {
      counts[v.seller_id] = (counts[v.seller_id] || 0) + 1;
    });
    setVoteCounts(counts);

    const lastVote = localStorage.getItem("voted_date");
    const todayKey = today.toDateString();
    if (lastVote === todayKey) setVotedToday(true);

    setLoadingVotes(false);
  }

  async function confirmVote() {
    if (!selectedSeller) return alert("Select a seller first.");
    if (votedToday) return alert("You already voted today.");

    try {
      const ip = await getPublicIp();
      const voterId = await getDeviceId();

      const { error } = await supabase
        .from("votes")
        .insert([
          { voter: voterId, seller_id: selectedSeller, ip_address: ip },
        ]);

      if (error) {
        if (error.message.includes("duplicate key"))
          return alert("You already voted today from this device.");
        console.error(error);
        return alert("Vote failed.");
      }

      localStorage.setItem("voted_date", new Date().toDateString());
      setVotedToday(true);
      await loadSellersAndVotes();
    } catch (err) {
      console.error("Vote failed:", err);
    }
  }

  async function getDeviceId() {
    let id = localStorage.getItem("deviceId");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("deviceId", id);
    }
    return id;
  }

  async function getPublicIp() {
    try {
      const res = await fetch("https://api.ipify.org?format=json");
      const data = await res.json();
      return data.ip;
    } catch {
      return "unknown";
    }
  }

  // --- UI ---
  return (
    <div className="container">
      <div className="cover">
        <img src="/cover.jpg" alt="Sraya Breakfast Cover" />
        <div className="cover-text">
          <h1>🥞 Sraya Breakfast Orders</h1>
        </div>
      </div>

      {/* ORDER FORM */}
      <div className="panel">
        <label>Name</label>
        <input
          type="text"
          value={customer}
          onChange={(e) => setCustomer(e.target.value)}
          className="full-width"
        />

        <label>Item</label>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          {menu.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>

        <label>Quantity</label>
        <input
          type="number"
          min="1"
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
        />

        <label>Note (optional)</label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Extra cheese, no onions..."
        />

        <div className="actions">
          <button onClick={addItem}>Add</button>
          <button onClick={() => setOrder([])} className="secondary">
            Clear
          </button>
        </div>
      </div>

      {/* CURRENT ORDER */}
      <div className="panel">
        <h2>Current Order</h2>
        {order.length === 0 ? (
          <p>No items yet.</p>
        ) : (
          <table className="order-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {order.map((o) => (
                <tr key={o.id}>
                  <td>
                    {o.name}
                    {o.note ? (
                      <div className="muted" style={{ fontSize: 12 }}>
                        Note: {o.note}
                      </div>
                    ) : null}
                  </td>
                  <td>{o.qty}</td>
                  <td>
                    <button
                      className="remove-btn"
                      onClick={() => removeItem(o.id)}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="actions">
          <button onClick={saveOrder} disabled={!order.length || saving}>
            {saving ? "Saving..." : "Save Order"}
          </button>
        </div>
      </div>

      {/* todays orders */}
      <div className="panel">
        <h3 style={{ marginTop: 12, color: "red" }}>Today's Orders</h3>
        {todayOrders.length === 0 ? (
          <p>No orders yet.</p>
        ) : (
          <div>
            {todayOrders.map((o) => (
              <div
                key={o.id}
                style={{ padding: "8px 0", borderBottom: "1px solid #eee" }}
              >
                <strong>{o.customer}</strong> —{" "}
                <small className="muted">
                  {new Date(o.created_at).toLocaleTimeString()}
                </small>
                <div>
                  {o.items.map((it: any) => (
                    <div key={it.id}>
                      {it.name} × {it.qty}
                      {it.note ? (
                        <div className="muted" style={{ fontSize: 12 }}>
                          Note: {it.note}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SUMMARY */}
      <div className="panel">
        <h2 style={{ color: "red" }}>Today's Summary</h2>
        {todaySummary.length === 0 ? (
          <p>No orders yet.</p>
        ) : (
          <table className="order-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
              </tr>
            </thead>
            <tbody>
              {todaySummary.map((s) => (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td>{s.qty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* VOTING SECTION */}
      <div className="panel">
        <h2>⭐ Vote for Today’s Best Seller</h2>
        {loadingVotes ? (
          <p>Loading...</p>
        ) : (
          <div className="voting-section">
            {sellers.map((s) => {
              const isSelected = selectedSeller === s.id;
              return (
                <div
                  key={s.id}
                  className={`vote-card ${isSelected ? "selected" : ""}`}
                  onClick={() => setSelectedSeller(s.id)}
                >
                  <h3>{s.name}</h3>
                  <p>{voteCounts[s.id] || 0} votes</p>
                </div>
              );
            })}
          </div>
        )}
        <div className="actions">
          <button
            onClick={confirmVote}
            disabled={!selectedSeller || votedToday}
          >
            {votedToday ? "Voted Today ✅" : "Confirm Vote"}
          </button>
        </div>
      </div>
      {/* ADMIN ENTRY */}
      <div className="panel" style={{ textAlign: "center" }}>
        <Link href="/admin/login">Go to Admin</Link>
      </div>

      <footer>
        <small>Day By Day Breakfast Ordering for Sraya</small>
      </footer>
    </div>
  );
}
