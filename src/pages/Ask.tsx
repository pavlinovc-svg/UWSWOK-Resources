import { FormEvent, useState } from "react";
import { answerQuestion } from "../lib/chat";
import { consumeToken, getOrganizations, getSession, tokenState } from "../lib/store";

type Msg = { role: "user" | "bot"; text: string };

export function Ask() {
  const session = getSession();
  const elevated = session && session.role !== "public";
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "bot",
      text: "Ask about food, shelter, tribal programs, homeless veteran services, hours, or domestic violence help. I only use organization documentation in this app. I will not invent hours or eligibility. I do not give medical advice.",
    },
  ]);
  const [tokens, setTokens] = useState(() => (session && elevated ? tokenState(session.email) : null));
  const [requested, setRequested] = useState(false);

  function send(e?: FormEvent) {
    e?.preventDefault();
    const q = input.trim();
    if (!q) return;
    if (elevated && session) {
      if (!consumeToken(session.email)) {
        setMsgs((m) => [
          ...m,
          { role: "user", text: q },
          {
            role: "bot",
            text: "You have used today’s 10 elevated questions (stored in this browser). Use Request more below — that is a stub until a backend is approved.",
          },
        ]);
        setTokens(tokenState(session.email));
        setInput("");
        return;
      }
      setTokens(tokenState(session.email));
    }
    const reply = answerQuestion(q, getOrganizations(), session);
    setMsgs((m) => [...m, { role: "user", text: q }, { role: "bot", text: reply }]);
    setInput("");
  }

  return (
    <div className="page">
      <h1>Ask UWSWOK Resources</h1>
      <p className="muted">
        Answers come only from United Way of Southwest Oklahoma organization listings and staff-updated lights. Unknown?
        We point you to 988, 911, or Heartline 211 (1-877-362-1606).
      </p>
      {elevated && tokens && (
        <p>
          Elevated demo account: {tokens.remaining} of 10 questions left today.
          <button className="btn ghost" style={{ marginLeft: "0.5rem" }} onClick={() => setRequested(true)} disabled={requested}>
            {requested ? "Request logged (stub)" : "Request more"}
          </button>
        </p>
      )}
      <div className="chat">
        {msgs.map((m, i) => (
          <div key={i} className={`bubble ${m.role}`}>
            {m.text}
          </div>
        ))}
      </div>
      <form
        className="row"
        style={{ marginTop: "1rem" }}
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input
          className="search"
          style={{ marginTop: 0 }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Where can I sleep tonight?"
        />
        <button className="btn" type="submit">
          Send
        </button>
      </form>
    </div>
  );
}
