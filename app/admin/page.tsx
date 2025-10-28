"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AdminPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const isAuth = localStorage.getItem("adminAuth");
    if (!isAuth) {
      router.push("/admin/login");
    } else {
      setAuthChecked(true);
    }
  }, [router]);

  if (!authChecked) {
    return <p>Loading...</p>;
  }

  return (
    <div className="container">
      <h1>Admin Dashboard</h1>

      <div className="panel">
        <h2>Manage Menu</h2>
        {/* your menu management section here */}
      </div>

      <div className="panel">
        <h2>Manage Orders</h2>
        {/* your orders section here */}
      </div>

      <div className="panel">
        <h2>Manage Sellers & Votes</h2>
        {/* your sellers and votes section here */}
      </div>
    </div>
  );
}
