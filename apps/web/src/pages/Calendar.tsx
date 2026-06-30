import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearToken } from "../lib/auth";
import { useMeQuery } from "../store/api";

export default function Calendar() {
  const [events, setEvents] = useState<any[]>([]);
  const { data: me } = useMeQuery();
  const navigate = useNavigate();

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:3000/ws`);
    ws.onmessage = (e) => {
      setEvents([...events, JSON.parse(e.data)]);
    };
    return () => ws.close();
  }, []);

  const onLogout = () => {
    clearToken();
    navigate("/login");
  };

  return (
    <div sx={{ p: 4, maxWidth: 960, mx: "auto" }}>
      <header
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <h1 sx={{ m: 0, fontSize: 4 }}>Calendar</h1>
        <div sx={{ display: "flex", gap: 3, alignItems: "center" }}>
          {me && (
            <span sx={{ color: "secondary", fontSize: 1 }}>{me.name}</span>
          )}
          <button onClick={onLogout} sx={{ variant: "buttons.border" }}>
            Sign out
          </button>
        </div>
      </header>
      <div
        sx={{
          p: 4,
          bg: "surface",
          borderRadius: "lg",
          boxShadow: "card",
          minHeight: 400,
        }}
      >
        <p sx={{ color: "secondary", mt: 0 }}>Calendar grid - to implement.</p>
        <pre sx={{ fontSize: 1, color: "secondary" }}>
          {JSON.stringify(events, null, 2)}
        </pre>
      </div>
    </div>
  );
}
