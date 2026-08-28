// BEFORE — a plain internal feedback forum. You log in with your real
// company account, so every "candid" post is tied to your real name
// forever, which defeats the point. Not wired into the Vite build; it's
// the "before" half of the story. Diff vs App.tsx: docs/forum.diff.txt.

import React, { useState } from "react";

interface Post {
  author: string;
  body: string;
}

const currentEmployee = { name: "Jordan Ellis", email: "jordan@acmeco.com" };

export function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [draft, setDraft] = useState("");
  const [posts, setPosts] = useState<Post[]>([
    { author: "Priya Nair", body: "Can we revisit the return-to-office policy?" },
  ]);

  return (
    <div>
      <h1>Candid — Internal Feedback Forum</h1>
      <div className="card">
        {!loggedIn ? (
          <button onClick={() => setLoggedIn(true)}>
            Log in as {currentEmployee.name} ({currentEmployee.email})
          </button>
        ) : (
          <>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Share honest feedback..."
            />
            <div style={{ marginTop: 10 }}>
              <button
                onClick={() => {
                  setPosts([{ author: currentEmployee.name, body: draft }, ...posts]);
                  setDraft("");
                }}
                disabled={!draft.trim()}
              >
                Post as {currentEmployee.name}
              </button>
            </div>
          </>
        )}
      </div>

      {posts.map((p, i) => (
        <div className="post" key={i}>
          <small>{p.author}</small>
          <p>{p.body}</p>
        </div>
      ))}
    </div>
  );
}
