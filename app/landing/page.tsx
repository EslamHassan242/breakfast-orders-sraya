"use client";
import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  generateRoomId,
  setRoomId,
  isValidRoomId,
  getRoomId,
} from "@/lib/roomUtils";
import { supabase } from "@/lib/supabaseClient";

function LandingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [roomIdInput, setRoomIdInput] = useState("");
  const [error, setError] = useState("");
  const [newRoomId, setNewRoomId] = useState<string | null>(null);
  
  // New State
  const [userName, setUserName] = useState("");
  const [roomName, setRoomName] = useState("");
  const [mode, setMode] = useState<"initial" | "create" | "join">("initial");

  useEffect(() => {
    const storedName = localStorage.getItem("customerName");
    if (storedName) setUserName(storedName);
  }, []);

  // Check if redirected from main page with room_id in query
  useEffect(() => {
    const roomIdFromQuery = searchParams.get("room");
    if (roomIdFromQuery && isValidRoomId(roomIdFromQuery)) {
      // Lobby Mode: Pre-fill room ID and ask for name
      setMode("join");
      setRoomIdInput(roomIdFromQuery);
    }
  }, [searchParams]);

  async function handleCreateRoom() {
    if (!userName.trim()) {
      setError("Please enter your name first.");
      return;
    }
    if (!roomName.trim()) {
      setError("Please enter a room name (e.g. 'Morning Coffee').");
      return;
    }

    localStorage.setItem("customerName", userName.trim());

    const roomId = generateRoomId();
    
    // Create room in Supabase
    const { error } = await supabase
      .from("rooms")
      .insert([{ id: roomId, name: roomName.trim() }]);

    if (error) {
      console.error("Failed to create room:", error);
      setError("Failed to create room. Please try again.");
      return;
    }

    setRoomId(roomId);
    setNewRoomId(roomId);
    
    // Auto redirect after short delay or let them copy
    // For now, let's just redirect immediately for smoother flow? 
    // Or show success state. The user asked for "creator to set room name".
    // Let's redirect immediately as per typical flow, but maybe show a success message first?
    // Actually, the previous code showed a success panel. Let's keep that but maybe nicer.
    // Wait, if we redirect, we can't show the panel. 
    // Let's redirect immediately to the room, the room page will show the room name.
    router.push("/");
  }

  function handleJoinRoom() {
    setError("");
    const trimmed = roomIdInput.trim();

    if (!userName.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!trimmed) {
      setError("Please enter a room ID");
      return;
    }

    if (!isValidRoomId(trimmed)) {
      setError("Invalid room ID format. Please check and try again.");
      return;
    }

    localStorage.setItem("customerName", userName.trim());
    setRoomId(trimmed);
    router.push("/");
  }

  return (
    <div className="landing-container">
      <style jsx global>{`
        body {
          margin: 0;
          font-family: 'Inter', sans-serif;
          background: linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%);
        }
        .landing-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background-image: url('https://images.unsplash.com/photo-1493770348161-369560ae357d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80');
          background-size: cover;
          background-position: center;
        }
        .landing-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          padding: 40px;
          border-radius: 24px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          width: 100%;
          max-width: 480px;
          text-align: center;
        }
        .logo {
          font-size: 3rem;
          margin-bottom: 10px;
        }
        h1 {
          color: #1a1a1a;
          margin: 0 0 8px 0;
          font-size: 2rem;
          font-weight: 800;
        }
        p {
          color: #666;
          margin-bottom: 32px;
          line-height: 1.5;
        }
        .input-group {
          margin-bottom: 20px;
          text-align: left;
        }
        label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: #333;
          font-size: 0.9rem;
        }
        input {
          width: 100%;
          padding: 14px;
          border: 2px solid #eee;
          border-radius: 12px;
          font-size: 1rem;
          transition: all 0.2s;
          box-sizing: border-box; /* Fix padding issue */
        }
        input:focus {
          border-color: #000;
          outline: none;
        }
        .btn {
          width: 100%;
          padding: 16px;
          border-radius: 12px;
          border: none;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.1s;
        }
        .btn:active {
          transform: scale(0.98);
        }
        .btn-primary {
          background: #000;
          color: #fff;
        }
        .btn-secondary {
          background: #f5f5f5;
          color: #333;
          margin-top: 12px;
        }
        .error {
          color: #e00;
          font-size: 0.9rem;
          margin-top: 10px;
          background: #fff0f0;
          padding: 10px;
          border-radius: 8px;
        }
        .back-btn {
          background: none;
          border: none;
          color: #666;
          cursor: pointer;
          margin-bottom: 20px;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 6px;
        }
      `}</style>

      <div className="landing-card">
        <div className="logo">🥞</div>
        <h1>Breakfast Orders</h1>
        <p>The easiest way to coordinate food & drinks with your team.</p>

        {mode === "initial" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
             <div className="input-group">
              <label>Your Name</label>
              <input 
                placeholder="Enter your name" 
                value={userName}
                onChange={e => setUserName(e.target.value)}
              />
            </div>
            
            <button 
              className="btn btn-primary"
              onClick={() => {
                if (!userName.trim()) {
                  setError("Please enter your name first.");
                  return;
                }
                setError("");
                setMode("create");
              }}
            >
               Create New Room
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => {
                if (!userName.trim()) {
                  setError("Please enter your name first.");
                  return;
                }
                setError("");
                setMode("join");
              }}
            >
              ➕ Join Existing Room
            </button>
          </div>
        )}

        {mode === "create" && (
          <div>
            <button className="back-btn" onClick={() => setMode("initial")}>← Back</button>
            <div className="input-group">
              <label>Room Name</label>
              <input 
                placeholder="e.g. Sunday Breakfast" 
                value={roomName}
                onChange={e => setRoomName(e.target.value)}
                autoFocus
              />
            </div>
            <button className="btn btn-primary" onClick={handleCreateRoom}>
              Create & Enter
            </button>
          </div>
        )}

        {mode === "join" && (
          <div>
            <button className="back-btn" onClick={() => setMode("initial")}>← Back</button>
            <div className="input-group">
              <label>Room ID</label>
              <input 
                placeholder="Paste Room ID here" 
                value={roomIdInput}
                onChange={e => setRoomIdInput(e.target.value)}
                autoFocus
              />
            </div>
            <button className="btn btn-primary" onClick={handleJoinRoom}>
              Join Room
            </button>
          </div>
        )}

        {error && <div className="error">{error}</div>}
        
        <div style={{ marginTop: 30, fontSize: "0.8rem", color: "#999" }}>
          Simple • Fast • Delicious
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LandingContent />
    </Suspense>
  );
}

