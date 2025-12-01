"use client";
import { Suspense, useState } from "react";
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
  const [copied, setCopied] = useState(false);
  const [newRoomId, setNewRoomId] = useState<string | null>(null);

  // Check if redirected from main page with room_id in query
  const roomIdFromQuery = searchParams.get("room");
  if (roomIdFromQuery && isValidRoomId(roomIdFromQuery)) {
    setRoomId(roomIdFromQuery);
    router.replace("/");
    return null;
  }

  async function handleCreateRoom() {
    const roomId = generateRoomId();
    
    // Create room in Supabase
    const { error } = await supabase
      .from("rooms")
      .insert([{ id: roomId }]);

    if (error) {
      console.error("Failed to create room:", error);
      setError("Failed to create room. Please try again.");
      return;
    }

    setRoomId(roomId);
    setNewRoomId(roomId);
    router.push("/");
  }

  function handleJoinRoom() {
    setError("");
    const trimmed = roomIdInput.trim();

    if (!trimmed) {
      setError("Please enter a room ID");
      return;
    }

    if (!isValidRoomId(trimmed)) {
      setError("Invalid room ID format. Please check and try again.");
      return;
    }

    setRoomId(trimmed);
    router.push("/");
  }

  function handleCopyRoomId() {
    if (!newRoomId) return;
    navigator.clipboard.writeText(newRoomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="container">
      <div className="cover">
        <div className="cover-text">
          <h1>🥞 Sraya Breakfast Orders</h1>
          <p>Create or join an ordering room</p>
        </div>
      </div>

      <div className="panel" style={{ textAlign: "center" }}>
        <h2>Welcome!</h2>
        <p style={{ color: "var(--muted)", marginBottom: "24px" }}>
          Create a new ordering room or join an existing one to start placing
          orders with your team.
        </p>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            maxWidth: "400px",
            margin: "0 auto",
          }}
        >
          <button
            onClick={handleCreateRoom}
            style={{
              padding: "16px 24px",
              fontSize: "1.1rem",
              width: "100%",
            }}
          >
            🆕 Create Room
          </button>

          <div style={{ margin: "16px 0", textAlign: "center" }}>
            <span style={{ color: "var(--muted)" }}>or</span>
          </div>

          <div>
            <input
              type="text"
              placeholder="Enter Room ID to join"
              value={roomIdInput}
              onChange={(e) => {
                setRoomIdInput(e.target.value);
                setError("");
              }}
              onKeyPress={(e) => {
                if (e.key === "Enter") handleJoinRoom();
              }}
              style={{
                width: "100%",
                padding: "12px",
                fontSize: "1rem",
                marginBottom: "8px",
              }}
            />
            {error && (
              <p style={{ color: "#e00", fontSize: "0.9rem", marginTop: "4px" }}>
                {error}
              </p>
            )}
            <button
              onClick={handleJoinRoom}
              className="secondary"
              style={{
                width: "100%",
                padding: "12px 24px",
              }}
            >
              ➕ Join Room
            </button>
          </div>
        </div>
      </div>

      {newRoomId && (
        <div className="panel" style={{ background: "#e9f8f7" }}>
          <h3 style={{ marginTop: 0 }}>Room Created! 🎉</h3>
          <p>Share this Room ID with your team:</p>
          <div
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "center",
              marginTop: "12px",
            }}
          >
            <code
              style={{
                flex: 1,
                background: "#fff",
                padding: "12px",
                borderRadius: "6px",
                border: "1px solid #ddd",
                fontFamily: "monospace",
                fontSize: "0.9rem",
                wordBreak: "break-all",
              }}
            >
              {newRoomId}
            </code>
            <button
              onClick={handleCopyRoomId}
              style={{
                padding: "12px 20px",
                whiteSpace: "nowrap",
              }}
            >
              {copied ? "✓ Copied!" : "📋 Copy"}
            </button>
          </div>
        </div>
      )}

      <footer>
        <small>Day By Day Breakfast Ordering for Sraya</small>
      </footer>
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

