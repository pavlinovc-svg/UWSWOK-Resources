import { useNavigate } from "react-router-dom";

export function AskButton() {
  const nav = useNavigate();
  return (
    <button className="ask-fab" onClick={() => nav("/ask")}>
      Ask
    </button>
  );
}
