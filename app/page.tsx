"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

// Utility: format as currency
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

  // --- NEW STATES FOR SELLERS & VOTES ---
  const [sellers, setSellers] = useState<any[]>([]);
  const [votesCount, setVotesCount] = useState<{ [key: number]: number }>({});
  const [selectedSeller, setSelectedSeller] = useState("");
  const [voterName, setVoterName] = useState("");
  const [voting, setVoting] = useState(false);
  const [voteMessage, setVoteMessage] = useState("");
  const [userIp, setUserIp] = useState("");

  // ✅ Load menu items + today's orders + sellers
  useEffect(() => {
    loadMenu();
    loadToday();
    loadSellers();
    loadIp();
  }, []);

  async function loadIp() {
    try {
      const res = await fetch("https://api.ipify.org?format=json");
      const data = await res.json();
      setUserIp(data.ip);
    } catch {
      setUserIp("unknown");
    }
  }

  async function loadMenu() {
    const { data, error } = await supabase.from("menu").select("*").order("id");
    if (error || !data) {
      const fallback = [
        { id: 1, name: "Coffee", price: 1.5 },
        { id: 2, name: "Tea", price: 1.25 },
        { id: 3, name: "Eggs", price: 2.5 },
        { id: 4, name: "Toast", price: 1.0 },
      ];
      setMenu(fallback);
      setSelectedId(String(fallback[0].id));
    } else {
      setMenu(data);
      if (data.length) setSelectedId(String(data[0].id));
    }
  }

  async function loadSellers() {
    const { data, error } = await supabase.from("sellers").select("*").order("id");
    if (!error && data) {
      setSellers(data);
      loadVotes();
    }
  }

  async function loadVotes() {
   const { data, error } = await supabase
  .from('votes')
  .select('seller_id, count:seller_id', { count: 'exact', head: false });

    if (!error && data) {
      const map: any = {};
      data.forEach((v: any) => (map[v.seller_id] = v.count));
      setVotesCount(map);
    }
  }

  // ✅ Save order
  async function saveOrder() {
    if (order.length === 0) return;
    if (!customer.trim()) {
      alert("Please enter your name before saving the order.");
      return;
    }

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
    } catch (error) {
      console.error("Save failed:", error);
      alert("Failed to save order. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // ✅ Load today's orders and compute summary
  async function loadToday() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .gte("created_at", startOfDay.toISOString())
      .order("created_at", { ascending: false });
    if (!error && data) {
      setTodayOrders(data);
      const map: Record<string, number> = {};
      data.forEach((o) =>
        o.items.forEach((it: any) => {
          map[it.name] = (map[it.name] || 0) + it.qty;
        })
      );
      setTodaySummary(Object.entries(map).map(([name, qty], i) => ({ id: i + 1, name, qty })));
    }
  }

  // ✅ Vote handler with IP restriction
  async function submitVote() {
    if (!selectedSeller) {
      setVoteMessage("Please select a seller.");
      return;
    }
    if (!voterName.trim()) {
      setVoteMessage("Please enter your name.");
      return;
    }
    if (!userIp) {
      setVoteMessage("Could not detect IP. Try again.");
      return;
    }

    setVoting(true);
    setVoteMessage("");

    try {
      const { error } = await supabase.from("votes").insert([
        {
          voter: voterName,
          seller_id: selectedSeller,
          ip_address: userIp,
          vote_date: new Date().toISOString().slice(0, 10),
          created_at: new Date().toISOString(),
        },
      ]);
      if (error) {
        if (error.message.includes("duplicate")) {
          setVoteMessage("⚠️ You already voted for this seller today!");
        } else throw error;
      } else {
        setVoteMessage("✅ Vote submitted successfully!");
        loadVotes();
      }
    } catch (err) {
      console.error(err);
      setVoteMessage("❌ Failed to submit vote.");
    } finally {
      setVoting(false);
    }
  }

  // --- Order utilities ---
  function addItem() {
    const item = menu.find((m) => String(m.id) === String(selectedId));
    if (!item) return;
    const q = Math.max(1, Math.floor(Number(qty) || 1));
    setOrder((prev) => {
      const exists = prev.find((p) => p.id === item.id);
      if (exists) {
        return prev.map((p) =>
          p.id === item.id ? { ...p, qty: p.qty + q } : p
        );
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, qty: q }];
    });
  }

  function updateOrderQty(id: number, newQty: number) {
    setOrder((prev) =>
      prev.map((p) => (p.id === id ? { ...p, qty: Math.max(1, newQty) } : p))
    );
  }

  function removeItem(id: number) {
    setOrder((prev) => prev.filter((p) => p.id !== id));
  }

  function clearOrder() {
    setOrder([]);
  }

  function total() {
    return order.reduce((s, o) => s + o.price * o.qty, 0);
  }

  // --- JSX ---
  return (
    <div className="container">
      {/* COVER IMAGE */}
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
          placeholder="Enter your name"
          className="full-width"
        />

        <label>Item</label>
        <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
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

        <div className="actions">
          <button onClick={addItem}>Add</button>
          <button onClick={clearOrder} className="secondary">
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
                  <td>{o.name}</td>
                  <td>
                    <div className="qty-control">
                      <button onClick={() => updateOrderQty(o.id, Math.max(1, o.qty - 1))}>-</button>
                      <input
                        type="number"
                        min="1"
                        value={o.qty}
                        onChange={(e) =>
                          updateOrderQty(o.id, Math.max(1, parseInt(e.target.value) || 1))
                        }
                      />
                      <button onClick={() => updateOrderQty(o.id, o.qty + 1)}>+</button>
                    </div>
                  </td>
                  <td>
                    <button className="remove-btn" onClick={() => removeItem(o.id)}>
                      <span className="desktop-text">Remove</span>
                      <span className="mobile-icon">🗑️</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="actions">
          <button onClick={saveOrder} disabled={order.length === 0 || saving}>
            {saving ? "Saving..." : `Save Order`}
          </button>
        </div>
      </div>

      {/* SUMMARY */}
      <div className="panel">
        <h2>Today's Summary</h2>
        {todaySummary.length === 0 ? (
          <p>No orders for today yet.</p>
        ) : (
          <table className="order-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Total Qty</th>
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

      {/* --- BEAUTIFUL SELLER VOTING SECTION --- */}
      <div className="panel bg-gradient-to-r from-yellow-100 to-orange-50 rounded-2xl shadow-lg p-4">
        <h2 className="text-2xl font-bold text-center mb-3 text-amber-800">
          🏆 Vote for Your Favorite Seller
        </h2>

        <div className="grid gap-2">
          {sellers.map((s) => (
            <div
              key={s.id}
              className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-yellow-200"
            >
              <div className="font-semibold text-gray-800">{s.name}</div>
              <div className="flex gap-3 items-center">
                <span className="text-amber-600 font-bold">
                  {votesCount[s.id] || 0} ❤️
                </span>
                <button
                  onClick={() => setSelectedSeller(s.id)}
                  className={`px-3 py-1 rounded-lg ${
                    selectedSeller == s.id
                      ? "bg-amber-600 text-white"
                      : "bg-amber-300 hover:bg-amber-400"
                  }`}
                >
                  Select
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <input
            type="text"
            value={voterName}
            onChange={(e) => setVoterName(e.target.value)}
            placeholder="Enter your name"
            className="w-full p-2 border rounded-lg"
          />
          <button
            onClick={submitVote}
            disabled={voting}
            className="mt-3 w-full bg-amber-600 text-white p-2 rounded-lg hover:bg-amber-700 transition"
          >
            {voting ? "Submitting..." : "Submit Vote"}
          </button>

          {voteMessage && (
            <p
              className={`mt-2 text-center ${
                voteMessage.startsWith("✅") ? "text-green-600" : "text-red-600"
              }`}
            >
              {voteMessage}
            </p>
          )}
        </div>
      </div>

      <footer>
        <small>Day By Day Breakfast Ordering For Sraya.</small>
      </footer>
    </div>
  );
}
