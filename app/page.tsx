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
  const [selectedSeller, setSelectedSeller] = useState("");
  const [voterName, setVoterName] = useState("");
  const [voting, setVoting] = useState(false);
  const [voteMessage, setVoteMessage] = useState("");

  // ✅ Load menu items + today's orders + sellers
  useEffect(() => {
    async function loadMenu() {
      const { data, error } = await supabase
        .from("menu")
        .select("*")
        .order("id");

      if (error || !data) {
        console.error("Menu load failed:", error);
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

    loadMenu();
    loadToday();
    loadSellers(); // ✅ new
  }, []);

  // ✅ Load sellers from Supabase
  async function loadSellers() {
    const { data, error } = await supabase.from("sellers").select("*").order("id");
    if (error) console.error("Failed to load sellers", error);
    else setSellers(data || []);
  }

  // ✅ Save order to Supabase
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

    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .gte("created_at", startOfDay.toISOString())
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;
      setTodayOrders(ordersData || []);

      const summaryMap: Record<string, number> = {};
      ordersData?.forEach((o) => {
        o.items.forEach((it: any) => {
          summaryMap[it.name] = (summaryMap[it.name] || 0) + it.qty;
        });
      });

      const summaryArr = Object.entries(summaryMap).map(([name, qty], i) => ({
        id: i + 1,
        name,
        qty,
      }));
      setTodaySummary(summaryArr);
    } catch (err) {
      console.error("Failed to load today data", err);
    }
  }

  // ✅ Add vote
  async function submitVote() {
    if (!selectedSeller) {
      setVoteMessage("Please select a seller to vote for.");
      return;
    }
    if (!voterName.trim()) {
      setVoteMessage("Please enter your name to vote.");
      return;
    }

    setVoting(true);
    setVoteMessage("");

    try {
      const { error } = await supabase.from("votes").insert([
        {
          voter: voterName,
          seller_id: selectedSeller,
          created_at: new Date().toISOString(),
        },
      ]);
      if (error) throw error;
      setVoteMessage("✅ Vote submitted successfully!");
      setVoterName("");
      setSelectedSeller("");
    } catch (err) {
      console.error("Vote failed:", err);
      setVoteMessage("❌ Failed to submit vote. Try again.");
    } finally {
      setVoting(false);
    }
  }

  // Order utilities
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

  return (
    <div className="container">
      {/* --- COVER IMAGE --- */}
      <div className="cover">
        <img src="/cover.jpg" alt="Sraya Breakfast Cover" />
        <div className="cover-text">
          <h1>🥞 Sraya Breakfast Orders</h1>
        </div>
      </div>

      {/* --- ORDER FORM --- */}
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

      {/* --- CURRENT ORDER --- */}
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

      {/* --- SUMMARY --- */}
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

        <h3 style={{ marginTop: 12 }}>Today's Orders</h3>
        {todayOrders.length === 0 ? (
          <p>No orders yet.</p>
        ) : (
          <div>
            {todayOrders.map((o) => (
              <div key={o.id} style={{ padding: "8px 0", borderBottom: "1px solid #eee" }}>
                <strong>{o.customer}</strong> —{" "}
                <small className="muted">
                  {new Date(o.created_at).toLocaleTimeString()}
                </small>
                <div>
                  {o.items.map((it: any) => (
                    <div key={it.id}>
                      {it.name} × {it.qty}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- SELLER VOTING --- */}
      <div className="panel">
        <h2>Vote for Your Favorite Seller 🏆</h2>
        <label>Your Name</label>
        <input
          type="text"
          value={voterName}
          onChange={(e) => setVoterName(e.target.value)}
          placeholder="Enter your name"
          className="full-width"
        />

        <label>Seller</label>
        <select
          value={selectedSeller}
          onChange={(e) => setSelectedSeller(e.target.value)}
        >
          <option value="">Select seller</option>
          {sellers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <div className="actions">
          <button onClick={submitVote} disabled={voting}>
            {voting ? "Submitting..." : "Vote"}
          </button>
        </div>

        {voteMessage && (
          <p style={{ color: voteMessage.startsWith("✅") ? "green" : "red" }}>
            {voteMessage}
          </p>
        )}
      </div>

      <footer>
        <small>Day By Day Breakfast Ordering For Sraya.</small>
      </footer>
    </div>
  );
}
