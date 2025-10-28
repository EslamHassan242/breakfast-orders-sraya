"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";


export default function UsersAdmin() {
  const [users, setUsers] = useState<any[]>([]);

  async function loadUsers() {
    const { data } = await supabase.from("users").select("*");
    setUsers(data || []);
  }

  useEffect(() => { loadUsers(); }, []);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Users</h2>
      <table className="w-full bg-white">
        <thead><tr><th>ID</th><th>Name</th><th>Email</th></tr></thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.id}</td><td>{u.name}</td><td>{u.email}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
