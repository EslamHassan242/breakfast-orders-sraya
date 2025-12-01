"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default function RoomSettings({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: roomId } = use(params);
  
  const [roomName, setRoomName] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [newCoverUrl, setNewCoverUrl] = useState("");
  
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [newMenuItem, setNewMenuItem] = useState({ name: "", price: "" });
  
  const [sellers, setSellers] = useState<any[]>([]);
  const [newSellerName, setNewSellerName] = useState("");

  useEffect(() => {
    loadRoomDetails();
    loadMenu();
    loadSellers();
  }, [roomId]);

  async function loadRoomDetails() {
    const { data } = await supabase
      .from("rooms")
      .select("*")
      .eq("id", roomId)
      .single();
    
    if (data) {
      setRoomName(data.name || "Untitled Room");
      setCoverUrl(data.cover_image_url || "");
      setNewCoverUrl(data.cover_image_url || "");
    }
  }

  async function loadMenu() {
    const { data } = await supabase
      .from("menu")
      .select("*")
      .eq("room_id", roomId)
      .order("id");
    setMenuItems(data || []);
  }

  async function loadSellers() {
    const { data } = await supabase
      .from("sellers")
      .select("*")
      .eq("room_id", roomId);
    setSellers(data || []);
  }

  async function updateCover() {
    const { error } = await supabase
      .from("rooms")
      .update({ cover_image_url: newCoverUrl })
      .eq("id", roomId);
    
    if (error) alert("Failed to update cover");
    else {
      setCoverUrl(newCoverUrl);
      alert("Cover updated!");
    }
  }

  async function addMenuItem() {
    if (!newMenuItem.name || !newMenuItem.price) return;
    const { error } = await supabase.from("menu").insert([{
      name: newMenuItem.name,
      price: Number(newMenuItem.price),
      room_id: roomId
    }]);

    if (error) alert("Failed to add item");
    else {
      setNewMenuItem({ name: "", price: "" });
      loadMenu();
    }
  }

  async function deleteMenuItem(id: number) {
    if (!confirm("Delete this item?")) return;
    await supabase.from("menu").delete().eq("id", id);
    loadMenu();
  }

  async function addSeller() {
    if (!newSellerName.trim()) return;
    const { error } = await supabase.from("sellers").insert([{
      name: newSellerName,
      room_id: roomId
    }]);

    if (error) alert("Failed to add seller");
    else {
      setNewSellerName("");
      loadSellers();
    }
  }

  async function deleteSeller(id: number) {
    if (!confirm("Delete this seller?")) return;
    await supabase.from("sellers").delete().eq("id", id);
    loadSellers();
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 20, fontFamily: "sans-serif" }}>
      <div style={{ marginBottom: 20 }}>
        <Link href="/" style={{ textDecoration: "none", color: "#666" }}>← Back to Order Page</Link>
      </div>

      <h1 style={{ marginBottom: 30 }}>⚙️ Settings: {roomName}</h1>

      {/* Cover Image */}
      <div className="panel" style={{ background: "#fff", padding: 20, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.1)", marginBottom: 24 }}>
        <h2 style={{ marginTop: 0 }}>🖼️ Cover Image</h2>
        <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
          <input 
            value={newCoverUrl}
            onChange={e => setNewCoverUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            style={{ flex: 1, padding: 10, borderRadius: 6, border: "1px solid #ddd" }}
          />
          <button onClick={updateCover} style={{ padding: "10px 20px", background: "#000", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}>Update</button>
        </div>
        {coverUrl && (
          <img src={coverUrl} alt="Cover Preview" style={{ width: "100%", maxHeight: 200, objectFit: "cover", borderRadius: 8 }} />
        )}
      </div>

      {/* Menu Items */}
      <div className="panel" style={{ background: "#fff", padding: 20, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.1)", marginBottom: 24 }}>
        <h2 style={{ marginTop: 0 }}>🍔 Custom Menu Items</h2>
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          <input 
            value={newMenuItem.name}
            onChange={e => setNewMenuItem({...newMenuItem, name: e.target.value})}
            placeholder="Item Name"
            style={{ flex: 2, padding: 10, borderRadius: 6, border: "1px solid #ddd" }}
          />
          <input 
            type="number"
            value={newMenuItem.price}
            onChange={e => setNewMenuItem({...newMenuItem, price: e.target.value})}
            placeholder="Price"
            style={{ flex: 1, padding: 10, borderRadius: 6, border: "1px solid #ddd" }}
          />
          <button onClick={addMenuItem} style={{ padding: "10px 20px", background: "#000", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}>Add</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {menuItems.map(item => (
            <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px", background: "#f9f9f9", borderRadius: 6 }}>
              <span>{item.name} - ${item.price}</span>
              <button onClick={() => deleteMenuItem(item.id)} style={{ color: "red", background: "none", border: "none", cursor: "pointer" }}>Delete</button>
            </div>
          ))}
          {menuItems.length === 0 && <p style={{ color: "#999" }}>No custom items yet.</p>}
        </div>
      </div>

      {/* Sellers */}
      <div className="panel" style={{ background: "#fff", padding: 20, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.1)", marginBottom: 24 }}>
        <h2 style={{ marginTop: 0 }}>🏪 Custom Sellers</h2>
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          <input 
            value={newSellerName}
            onChange={e => setNewSellerName(e.target.value)}
            placeholder="Seller Name"
            style={{ flex: 1, padding: 10, borderRadius: 6, border: "1px solid #ddd" }}
          />
          <button onClick={addSeller} style={{ padding: "10px 20px", background: "#000", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}>Add</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {sellers.map(seller => (
            <div key={seller.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px", background: "#f9f9f9", borderRadius: 6 }}>
              <span>{seller.name}</span>
              <button onClick={() => deleteSeller(seller.id)} style={{ color: "red", background: "none", border: "none", cursor: "pointer" }}>Delete</button>
            </div>
          ))}
          {sellers.length === 0 && <p style={{ color: "#999" }}>No custom sellers yet.</p>}
        </div>
      </div>
    </div>
  );
}
