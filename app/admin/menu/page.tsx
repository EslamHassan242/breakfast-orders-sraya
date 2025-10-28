"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";


export default function MenuAdmin() {
  const [items, setItems] = useState<any[]>([]);
  const [newItem, setNewItem] = useState({ name: "", price: "" });

  async function loadItems() {
    const { data } = await supabase.from("menu").select("*");
    setItems(data || []);
  }

  async function addItem() {
    if (!newItem.name || !newItem.price) return;
    await supabase.from("menu").insert([newItem]);
    setNewItem({ name: "", price: "" });
    loadItems();
  }

  async function deleteItem(id: number) {
    await supabase.from("menu").delete().eq("id", id);
    loadItems();
  }

  useEffect(() => { loadItems(); }, []);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Menu Management</h2>
      <div className="flex gap-2 mb-4">
        <input placeholder="Item name" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
        <input placeholder="Price" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} />
        <button onClick={addItem}>Add</button>
      </div>
      <table className="w-full bg-white">
        <thead><tr><th>ID</th><th>Name</th><th>Price</th><th></th></tr></thead>
        <tbody>
          {items.map(i => (
            <tr key={i.id}>
              <td>{i.id}</td><td>{i.name}</td><td>{i.price}</td>
              <td><button onClick={() => deleteItem(i.id)} className="text-red-500">Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
