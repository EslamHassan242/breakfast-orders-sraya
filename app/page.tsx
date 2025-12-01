"use client";
import React, { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import {
  getRoomId,
  setRoomId as storeRoomId,
  clearRoomId,
  isValidRoomId,
} from "@/lib/roomUtils";

type NoteSummaryEntry = { text: string; count: number };

// Utility
function currency(n: number) {
  return `$${n.toFixed(2)}`;
}

const DEFAULT_NOTE_SUGGESTIONS = [
  "بدون بصل",
  "بدون بيض",
  "طماطم فقط",
  "سبايسي",
  "زيادة جبنة",
  "خبز شامي",
  "خبز بلدي ",
  " طحينة فقط",
  "توابل فقط",
  "كاتشب فقك",
  "مايونيز فقط",
  "أقل ملح",
];



function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [showRoomInfo, setShowRoomInfo] = useState(false);
  const [copied, setCopied] = useState(false);
  const [menu, setMenu] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [qty, setQty] = useState(1);
  const [order, setOrder] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [customer, setCustomer] = useState("");
  const [todayOrders, setTodayOrders] = useState<any[]>([]);
  const [todaySummary, setTodaySummary] = useState<any[]>([]);
  const [note, setNote] = useState("");
  const [noteSuggestions, setNoteSuggestions] = useState<string[]>(
    DEFAULT_NOTE_SUGGESTIONS
  );
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [allNotes, setAllNotes] = useState<string[]>([]);
  const [roomName, setRoomName] = useState("");
  const [roomCover, setRoomCover] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const noteBadgeStyle: React.CSSProperties = {
    backgroundColor: "#fff7e6",
    color: "#b7791f",
    fontSize: "0.75rem",
    padding: "2px 8px",
    borderRadius: "999px",
    display: "inline-block",
  };
  const noteSummaryWrapperStyle: React.CSSProperties = {
    display: "inline-block",
  };
  const noteSummaryPartStyle: React.CSSProperties = {
    marginInlineEnd: 6,
    display: "inline-block",
  };

  const renderNoteLabel = (value?: string | null) => {
    const trimmed = value?.trim();
    if (!trimmed) return <span className="muted">-</span>;
    return <span style={noteBadgeStyle}>{trimmed}</span>;
  };

  const renderNoteSummary = (notes?: NoteSummaryEntry[]) => {
    if (!notes || !notes.length) return <span className="muted">-</span>;
    return (
      <span style={noteSummaryWrapperStyle} dir="auto">
        (
        {notes.map((note, idx) => (
          <span
            key={`${note.text}-${idx}`}
            style={noteSummaryPartStyle}
            dir="auto"
          >
            {note.count} {note.text}
            {idx < notes.length - 1 ? ", " : ""}
          </span>
        ))}
        )
      </span>
    );
  };

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
    
    // Load customer name
    const storedName = localStorage.getItem("customerName");
    if (storedName) {
      setCustomer(storedName);
    } else {
      // If no name, redirect to landing to set it
      // router.push("/landing"); 
      // Actually, let's just let them be, but maybe prompt?
      // The requirement said "user can join with room id and should enter his name sothat he uses it in the room for everything"
      // I'll assume they come from landing page which sets it.
    }
  }, []);

  // Check for room ID on mount (from localStorage or URL query)
  useEffect(() => {
    // First check URL query parameter (for sharing links)
    const roomIdFromQuery = searchParams.get("room");
    if (roomIdFromQuery && isValidRoomId(roomIdFromQuery)) {
      storeRoomId(roomIdFromQuery); // Store in localStorage
      setRoomId(roomIdFromQuery); // Update React state
      router.replace("/"); // Clean URL
      return;
    }

    // Then check localStorage
    const currentRoomId = getRoomId();
    if (!currentRoomId || !isValidRoomId(currentRoomId)) {
      router.push("/landing");
      return;
    }
    setRoomId(currentRoomId);
  }, [router, searchParams]);

  useEffect(() => {
    if (!roomId) return;
    
    // Validate room exists in database
    async function validateRoom() {
      const { data, error } = await supabase
        .from("rooms")
        .select("id")
        .eq("id", roomId)
        .single();
      
      if (error || !data) {
        // Room doesn't exist in database
        alert("This room no longer exists. Please create a new room.");
        clearRoomId();
        router.push("/landing");
        return;
      }
      
      // Room exists, proceed with loading
      loadRoomDetails();
      loadMenu();
      loadToday();
      loadSellersAndVotes();
      loadNoteSuggestions();
    }
    
    validateRoom();
  }, [roomId]);

  async function loadRoomDetails() {
    if (!roomId) return;
    const { data, error } = await supabase
      .from("rooms")
      .select("cover_image_url, name")
      .eq("id", roomId)
      .single();
    
    if (data) {
      setRoomCover(data.cover_image_url);
      setRoomName(data.name || "Breakfast Room");
    }
  }

  async function loadNoteSuggestions() {
    setLoadingNotes(true);
    try {
      // Load top 5 for chips
      const { data: topData, error: topError } = await supabase
        .from("note_presets")
        .select("text, usage_count")
        .order("usage_count", { ascending: false })
        .limit(5);
      
      if (topError) throw topError;
      
      const topCleaned =
        topData
          ?.map((row: any) => (row?.text || "").trim())
          .filter((t: string) => t.length > 0) ?? [];
      
      if (topCleaned.length) {
        setNoteSuggestions(topCleaned);
      } else {
        setNoteSuggestions(DEFAULT_NOTE_SUGGESTIONS);
      }

      // Load all notes for datalist
      const { data: allData } = await supabase
        .from("note_presets")
        .select("text")
        .order("text");
      
      const allCleaned =
        allData
          ?.map((row: any) => (row?.text || "").trim())
          .filter((t: string) => t.length > 0) ?? [];
      
      setAllNotes(allCleaned);
    } catch (err) {
      console.warn("Note presets load failed:", err);
      setNoteSuggestions(DEFAULT_NOTE_SUGGESTIONS);
    } finally {
      setLoadingNotes(false);
    }
  }


  // --- MENU + ORDERS ---
  async function loadMenu() {
    // Load global items (room_id is null) AND room items
    const { data, error } = await supabase
      .from("menu")
      .select("*")
      .or(`room_id.is.null,room_id.eq.${roomId}`)
      .order("id");

    if (error || !data) {
      console.error("Menu load failed:", error);
      // Fallback only if DB fails completely
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

  async function saveNoteToDatabase(noteText: string) {
    if (!noteText.trim()) return;
    
    // Check if note already exists
    const { data: existing } = await supabase
      .from("note_presets")
      .select("id, usage_count")
      .eq("text", noteText.trim())
      .single();
    
    if (existing) {
      // Increment usage count
      await supabase
        .from("note_presets")
        .update({ usage_count: (existing.usage_count || 0) + 1 })
        .eq("id", existing.id);
    } else {
      // Insert new note
      await supabase
        .from("note_presets")
        .insert([{ text: noteText.trim(), usage_count: 1 }]);
    }
    
    // Reload suggestions to show updated top 5
    loadNoteSuggestions();
  }

  async function saveOrder() {
    if (!roomId) {
      alert("No room selected. Redirecting to landing...");
      router.push("/landing");
      return;
    }
    if (!customer.trim()) {
       // If name is missing, prompt for it
       const name = prompt("Please enter your name:");
       if (name) {
         setCustomer(name);
         localStorage.setItem("customerName", name);
       } else {
         return alert("Name is required.");
       }
    }
    if (order.length === 0) return alert("No items selected.");

    setSaving(true);
    try {
      // Save all notes from the order to database
      const uniqueNotes = [...new Set(order.map(o => o.note).filter(n => n && n.trim()))];
      for (const noteText of uniqueNotes) {
        await saveNoteToDatabase(noteText);
      }

      const { error } = await supabase.from("orders").insert([
        {
          customer: customer || localStorage.getItem("customerName"), // Ensure we use the latest
          items: order,
          total: total(),
          room_id: roomId,
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
    if (!roomId) return;
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("room_id", roomId)
      .gte("created_at", start.toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setTodayOrders(data || []);

    const map: Record<
      string,
      {
        qty: number;
        notes: Map<string, number>;
        id: string | number | undefined;
      }
    > = {};
    data?.forEach((o) =>
      o.items.forEach((it: any) => {
        if (!map[it.name]) {
          map[it.name] = {
            qty: 0,
            notes: new Map(),
            id: it.id,
          };
        }
        map[it.name].qty += it.qty;
        if (it.note && String(it.note).trim()) {
          const noteKey = String(it.note).trim();
          const current = map[it.name].notes.get(noteKey) || 0;
          map[it.name].notes.set(noteKey, current + it.qty);
        }
      })
    );

    setTodaySummary(
      Object.entries(map).map(([name, value], i) => ({
        id: value.id ?? i + 1,
        name,
        qty: value.qty,
        notes: Array.from(value.notes.entries()).map(([text, count]) => ({
          text,
          count,
        })),
      }))
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

  function removeItem(itemId: number, itemNote?: string) {
    const targetNote = (itemNote ?? "").trim();
    setOrder((prev) =>
      prev.filter((p) => {
        const currentNote = (p.note ?? "").trim();
        return !(p.id === itemId && currentNote === targetNote);
      })
    );
  }


  function total() {
    return order.reduce((s, o) => s + o.price * o.qty, 0);
  }

  // --- VOTING LOGIC ---
  async function loadSellersAndVotes() {
    if (!roomId) return;
    setLoadingVotes(true);
    
    // Load global sellers AND room sellers
    const { data: sellersData } = await supabase
      .from("sellers")
      .select("*")
      .or(`room_id.is.null,room_id.eq.${roomId}`);
      
    setSellers(sellersData || []);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { data: votesData } = await supabase
      .from("votes")
      .select("seller_id")
      .eq("room_id", roomId)
      .gte("created_at", today.toISOString());

    const counts: Record<number, number> = {};
    votesData?.forEach((v) => {
      counts[v.seller_id] = (counts[v.seller_id] || 0) + 1;
    });
    setVoteCounts(counts);

    // Check if voted in THIS room today
    const voteKey = `voted_${roomId}_${today.toDateString()}`;
    const hasVoted = localStorage.getItem(voteKey) === "true";
    setVotedToday(hasVoted);

    setLoadingVotes(false);
  }

  async function confirmVote() {
    if (!selectedSeller) return alert("Select a seller first.");
    if (votedToday) return alert("You already voted today.");

    try {
      const ip = await getPublicIp();
      const voterId = await getDeviceId();

      console.log("Voting:", { voterId, selectedSeller, ip, roomId });

      const { error } = await supabase
        .from("votes")
        .insert([
          {
            voter: voterId,
            seller_id: selectedSeller,
            ip_address: ip,
            room_id: roomId,
          },
        ]);

      if (error) {
        console.error("Vote error:", error);
        if (error.message.includes("duplicate key"))
          return alert("You already voted today from this device.");
        return alert(`Vote failed: ${error.message}`);
      }

      // Store vote per room
      const voteKey = `voted_${roomId}_${new Date().toDateString()}`;
      localStorage.setItem(voteKey, "true");
      setVotedToday(true);
      await loadSellersAndVotes();
    } catch (err) {
      console.error("Vote exception:", err);
      alert("Vote failed due to an unexpected error.");
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

  function handleCopyRoomId() {
    if (!roomId) return;
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleLeaveRoom() {
    if (confirm("Leave this room? You'll need to rejoin with the Room ID.")) {
      clearRoomId();
      router.push("/landing");
    }
  }

  function handleShareRoom() {
    if (!roomId) return;
    const url = `${window.location.origin}?room=${roomId}`;
    if (navigator.share) {
      navigator.share({
        title: "Join my breakfast ordering room",
        text: `Join my breakfast ordering room! Room ID: ${roomId}`,
        url: url,
      });
    } else {
      navigator.clipboard.writeText(url);
      alert("Room link copied to clipboard!");
    }
  }

  // Don't render main UI until room ID is confirmed
  if (!roomId) {
    return (
      <div className="container">
        <div className="panel" style={{ textAlign: "center" }}>
          <p>Loading room...</p>
        </div>
      </div>
    );
  }

  // --- UI ---
  return (
    <div className="container">
      {/* Room Info Banner */}
      <div className="panel" style={{ background: "#e9f8f7", marginBottom: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ flex: 1, minWidth: "200px" }}>
            <div style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: "4px" }}>
              Room ID
            </div>
            <code
              style={{
                fontFamily: "monospace",
                fontSize: "0.9rem",
                background: "#fff",
                padding: "6px 12px",
                borderRadius: "6px",
                border: "1px solid #d5ebe7",
                display: "inline-block",
                wordBreak: "break-all",
              }}
            >
              {roomId}
            </code>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              onClick={handleCopyRoomId}
              className="secondary"
              style={{ padding: "8px 16px", fontSize: "0.9rem" }}
            >
              {copied ? "✓ Copied!" : "📋 Copy ID"}
            </button>
            <button
              onClick={handleShareRoom}
              className="secondary"
              style={{ padding: "8px 16px", fontSize: "0.9rem" }}
            >
              🔗 Share
            </button>
            <Link
              href={`/room/${roomId}/settings`}
              style={{
                textDecoration: "none",
                background: "#f5f5f5",
                color: "#333",
                padding: "8px 16px",
                fontSize: "0.9rem",
                borderRadius: "6px",
                border: "1px solid #ddd",
                display: "inline-block"
              }}
            >
              ⚙️ Settings
            </Link>
            <button
              onClick={handleLeaveRoom}
              style={{
                background: "#dc3545",
                padding: "8px 16px",
                fontSize: "0.9rem",
              }}
            >
              🚪 Leave
            </button>
          </div>
        </div>
      </div>

      <div className="cover">
        <img src={roomCover || "/cover.jpg"} alt="Breakfast Cover" />
        <div className="cover-text">
          <h1>{roomName}</h1>
          <p style={{ margin: 0, opacity: 0.9 }}>🥞 Sharing Orders</p>
        </div>
      </div>

      {/* ORDER FORM */}
      <div className="panel">
        {/* Name input removed - using stored name */}
        <div style={{ marginBottom: 16, color: "#666" }}>
          Ordering as: <strong>{customer}</strong>
        </div>

        <label>Item</label>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="full-width"
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
          list="note-presets"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Extra cheese, no onions..."
          className="full-width"
        />
        <datalist id="note-presets">
          {allNotes.map((suggestion) => (
            <option value={suggestion} key={`option-${suggestion}`} />
          ))}
        </datalist>
        <div className="note-suggestions">
          {loadingNotes ? (
            <span className="muted small-text">Loading suggestions...</span>
          ) : (
            noteSuggestions.map((suggestion) => {
              const isActive = note.trim() === suggestion;
              return (
                <button
                  key={suggestion}
                  type="button"
                  className={`note-chip ${isActive ? "selected" : ""}`}
                  onClick={() => setNote(suggestion)}
                >
                  {suggestion}
                </button>
              );
            })
          )}
        </div>

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
          <table className="order-table order-table--current">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Note</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {order.map((o) => (
                <tr key={`${o.id}-${o.note ?? "none"}`}>
                  <td>{o.name}</td>
                  <td>{o.qty}</td>
                  <td>{renderNoteLabel(o.note)}</td>
                  <td>
                    <button
                      className="remove-btn"
                      onClick={() => removeItem(o.id, o.note)}
                      aria-label="Remove item"
                    >
                      <span aria-hidden="true" className="trash-icon">
                        🗑
                      </span>
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
          <div className="space-y-4">
            {todayOrders.map((o) => (
              <div
                key={o.id}
                className="order-card"
                style={{ borderBottom: "1px solid #eee", paddingBottom: 12 }}
              >
                <div className="customer-header">
                  <span className="customer-name">{o.customer}</span>
                  <span className="order-time">
                  {new Date(o.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <table
                  className="order-table order-table--customer"
                  style={{ marginTop: 8 }}
                >
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Qty</th>
                      <th>Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {o.items.map((it: any, idx: number) => (
                      <tr key={`${o.id}-${idx}`}>
                        <td>{it.name}</td>
                        <td>{it.qty}</td>
                        <td>{renderNoteLabel(it.note)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
          <table className="order-table order-table--summary">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {todaySummary.map((s) => (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td>{s.qty}</td>
                  <td>{renderNoteSummary(s.notes)}</td>
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

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
