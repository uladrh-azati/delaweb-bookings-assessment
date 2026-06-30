import { SubmitEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { setToken } from "../lib/auth";
import { useLoginMutation } from "../store/api";

export default function Login() {
  const [name, setName] = useState("");
  const [login, { isLoading, error }] = useLoginMutation();
  const navigate = useNavigate();

  const onSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim()) return;
    const result = await login({ name: name.trim() }).unwrap();
    setToken(result.token);
    navigate("/");
  };

  return (
    <div
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
      }}
    >
      <form
        onSubmit={onSubmit}
        sx={{
          p: 4,
          bg: "surface",
          borderRadius: "lg",
          boxShadow: "card",
          width: 320,
        }}
      >
        <h1 sx={{ mt: 0, mb: 3, fontSize: 4 }}>Sign in</h1>
        <label
          sx={{ display: "block", mb: 1, fontSize: 1, color: "secondary" }}
        >
          Name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          autoFocus
          sx={{
            width: "100%",
            p: 2,
            borderRadius: "md",
            border: "1px solid",
            borderColor: "border",
            mb: 3,
            fontSize: 2,
            boxSizing: "border-box",
          }}
        />
        <button
          type="submit"
          disabled={isLoading || !name.trim()}
          sx={{ variant: "buttons.primary", width: "100%" }}
        >
          {isLoading ? "Signing in…" : "Sign in"}
        </button>
        {error && (
          <div sx={{ color: "error", mt: 2, fontSize: 1 }}>Login failed</div>
        )}
      </form>
    </div>
  );
}
