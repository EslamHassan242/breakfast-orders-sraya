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

  const DEFAULT_COVER = "/cover.jpeg";

  const [uploading, setUploading] = useState(false);

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
      setCoverUrl(data.cover_image_url || DEFAULT_COVER);
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

  async function compressImage(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Set max dimensions (1200x400 for cover)
          const maxWidth = 1200;
          const maxHeight = 400;
          let width = img.width;
          let height = img.height;
          
          // Calculate aspect ratio
          const aspectRatio = width / height;
          
          if (width > maxWidth) {
            width = maxWidth;
            height = width / aspectRatio;
          }
          
          if (height > maxHeight) {
            height = maxHeight;
            width = height * aspectRatio;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          ctx?.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Canvas to Blob conversion failed'));
              }
            },
            'image/jpeg',
            0.85 // Quality 85%
          );
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    
    setUploading(true);

    try {
      // Compress the image
      const compressedBlob = await compressImage(file);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${roomId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('covers')
        .upload(filePath, compressedBlob, {
          contentType: 'image/jpeg'
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('covers').getPublicUrl(filePath);
      const publicUrl = data.publicUrl;

      // Update room with new cover
      const { error: updateError } = await supabase
        .from("rooms")
        .update({ cover_image_url: publicUrl })
        .eq("id", roomId);

      if (updateError) throw updateError;

      setCoverUrl(publicUrl);
      alert("Cover image updated successfully!");
    } catch (error: any) {
      console.error("Upload failed:", error);
      alert(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  }

  async function removeCover() {
    if (!confirm("Remove cover image and use default?")) return;
    
    const { error } = await supabase
      .from("rooms")
      .update({ cover_image_url: DEFAULT_COVER })
      .eq("id", roomId);
    
    if (error) {
      alert("Failed to remove cover");
    } else {
      setCoverUrl(DEFAULT_COVER);
      alert("Cover removed!");
    }
  }

  async function addMenuItem() {
    if (!newMenuItem.name || !newMenuItem.price) return alert("Please enter name and price");
    
    const price = Number(newMenuItem.price);
    if (isNaN(price)) return alert("Invalid price");

    const { error } = await supabase.from("menu").insert([{
      name: newMenuItem.name,
      price: price,
      room_id: roomId
    }]);

    if (error) {
      console.error("Add item failed:", error);
      alert(`Failed to add item: ${error.message}`);
    } else {
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

    if (error) {
       console.error("Add seller failed:", error);
       alert(`Failed to add seller: ${error.message}`);
    } else {
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
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Upload New Cover</label>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input 
              type="file" 
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
              style={{ flex: 1 }}
            />
            <button 
              onClick={removeCover}
              style={{ padding: "10px 16px", background: "#dc3545", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", whiteSpace: "nowrap" }}
            >
              Remove Cover
            </button>
          </div>
          {uploading && <p style={{ color: "#666", fontSize: "0.9rem", marginTop: 8 }}>Compressing and uploading...</p>}
        </div>
        
        {coverUrl && (
          <div>
            <p style={{ marginBottom: 8, fontWeight: 500 }}>Current Cover:</p>
            <img src={coverUrl} alt="Cover Preview" style={{ width: "100%", maxHeight: 300, objectFit: "cover", borderRadius: 8 }} />
          </div>
        )}
      </div>

      {/* Menu Items */}
      <div className="panel" style={{ background: "#fff", padding: 20, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.1)", marginBottom: 24 }}>
        <h2 style={{ marginTop: 0 }}>🍔  Menu Items</h2>
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
          {menuItems.length === 0 && <p style={{ color: "#999" }}>No  items yet.</p>}
        </div>
      </div>

      {/* Sellers */}
      <div className="panel" style={{ background: "#fff", padding: 20, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.1)", marginBottom: 24 }}>
        <h2 style={{ marginTop: 0 }}>🏪  Sellers</h2>
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
          {sellers.length === 0 && <p style={{ color: "#999" }}>No  sellers yet.</p>}
        </div>
      </div>
    </div>
  );
}
