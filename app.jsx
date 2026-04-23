const { useState } = React;

// ─── tiny code-snippet component used for the teaching panels ──────────────
// renders a monospace block. lines listed in `highlight` get a yellow accent
// so the diff between variants jumps out.
function Code({ children, highlight }) {
  const lines = String(children).replace(/\n$/, "").split("\n");
  const set = new Set(highlight ?? []);
  return (
    <pre className="code" aria-label="code sample">
      {lines.map((line, i) => (
        <span
          key={i}
          className={"code-line" + (set.has(i + 1) ? " highlight" : "")}
        >
          <span className="code-gutter">{i + 1}</span>
          <span className="code-text">{line || " "}</span>
        </span>
      ))}
    </pre>
  );
}

// ─── shared leaf used by the scoreboard demo ────────────────────────────────
function Counter({ person }) {
  const [score, setScore] = useState(0);
  const [hover, setHover] = useState(false);
  return (
    <div
      className={"counter" + (hover ? " hover" : "")}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
    >
      <h4>{person}'s score: {score}</h4>
      <button onClick={() => setScore(score + 1)}>Add one</button>
    </div>
  );
}

// ─── demo 1: the canonical scoreboard from the docs ─────────────────────────
function ScoreboardDemo() {
  const [isPlayerA, setIsPlayerA] = useState(true);
  const person = isPlayerA ? "Taylor" : "Sarah";

  return (
    <section className="demo">
      <h2>1. Two counters, one diff: the <code>key</code></h2>
      <h3>Same JSX position, but a <code>key</code> tells React "this is a different counter".</h3>

      <div className="cols">
        <div className="col">
          <header>
            <strong>Without key</strong>
            <span className="tag bad">state preserved</span>
          </header>
          <Counter person={person} />
          <Code highlight={[1]}>{
`<Counter person={person} />`
          }</Code>
          <p className="note">React sees one <code>Counter</code> at this slot. Switching the player keeps the score.</p>
        </div>

        <div className="col">
          <header>
            <strong>With <code>key=&#123;person&#125;</code></strong>
            <span className="tag good">state reset</span>
          </header>
          <Counter key={person} person={person} />
          <Code highlight={[1]}>{
`<Counter key={person} person={person} />`
          }</Code>
          <p className="note">Key changes between "Taylor" and "Sarah" — React unmounts and remounts. Score restarts at 0.</p>
        </div>
      </div>

      <div className="actions">
        <button onClick={() => setIsPlayerA(p => !p)}>Next player (current: {person})</button>
      </div>
    </section>
  );
}

// ─── demo 2: messenger / form-reset use case from the docs ──────────────────
const contacts = [
  { id: 0, name: "Taylor", email: "taylor@mail.com" },
  { id: 1, name: "Alice",  email: "alice@mail.com"  },
  { id: 2, name: "Bob",    email: "bob@mail.com"    },
];

function ContactList({ selectedId, onSelect }) {
  return (
    <nav className="contact-list">
      <ul>
        {contacts.map(c => (
          <li key={c.id}>
            <button
              className={c.id === selectedId ? "selected" : ""}
              onClick={() => onSelect(c)}
            >
              {c.name}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function Chat({ contact }) {
  const [text, setText] = useState("");
  return (
    <div className="chat">
      <textarea
        value={text}
        placeholder={"Chat to " + contact.name}
        onChange={e => setText(e.target.value)}
      />
      <div className="row">
        <button>Send to {contact.email}</button>
      </div>
    </div>
  );
}

function MessengerDemo() {
  const [to, setTo] = useState(contacts[0]);
  const [useKey, setUseKey] = useState(false);

  return (
    <section className="demo">
      <h2>2. Resetting a form with a <code>key</code></h2>
      <h3>Type a draft, then switch recipients. The toggle controls whether <code>Chat</code> gets <code>key=&#123;to.id&#125;</code>.</h3>

      <div className="messenger">
        <ContactList selectedId={to.id} onSelect={setTo} />
        {useKey
          ? <Chat key={to.id} contact={to} />
          : <Chat contact={to} />}
      </div>

      <div className="actions">
        <button className="ghost" onClick={() => setUseKey(k => !k)}>
          {useKey ? "Disable key (draft will leak)" : "Enable key (draft will reset)"}
        </button>
        <span className={"tag " + (useKey ? "good" : "bad")}>
          {useKey ? "key on — state resets per recipient" : "no key — draft persists across recipients"}
        </span>
      </div>

      <div className="cols teach">
        <div className="col">
          <header><strong>No key</strong><span className="tag bad">leak</span></header>
          <Code highlight={[2]}>{
`<ContactList ... />
<Chat contact={to} />`
          }</Code>
        </div>
        <div className="col">
          <header><strong>Keyed by recipient</strong><span className="tag good">reset</span></header>
          <Code highlight={[2]}>{
`<ContactList ... />
<Chat key={to.id} contact={to} />`
          }</Code>
        </div>
      </div>

      <p className="note">
        Without a key, React reuses the same <code>Chat</code> instance because it sits at the same
        position in the tree, so the typed draft sticks around. <code>key=&#123;to.id&#125;</code>
        tells React "this is a different chat", forcing a fresh mount and clearing state.
      </p>
    </section>
  );
}

// ─── demo 3: choosing the *right* key (PR-comment exchange) ─────────────────
// scenario: a `StepComponent` has internal draft state. the parent has two
// transitions: (a) "toggle status" flips status from editing → readonly and
// back; (b) "cancel & restart" is a transition that should also reset the
// draft, but the status itself is unchanged.
//
// three side-by-side instances differ ONLY in the key strategy:
//   A) no key                 – never resets
//   B) key={status}           – resets on (a) only; misses (b) entirely
//   C) key={remountKey}       – resets on every transition the parent fires
//
// (b) is the case the PR author calls out: "the same step can re-enter the
// same status and React can still preserve the existing StepComponent
// instance, including cancelled draft state." a counter incremented per
// transition is the unambiguous signal.

function StepComponent({ status, label }) {
  const [draft, setDraft] = useState("");
  return (
    <div className="step">
      <div className="step-head">
        <span className={"badge " + status}>{status}</span>
        <small>{label}</small>
      </div>
      <textarea
        value={draft}
        placeholder={status === "readonly" ? "(read only)" : "type a draft note..."}
        onChange={e => setDraft(e.target.value)}
        readOnly={status === "readonly"}
      />
      <div className="draft-preview">
        draft: <code>{draft || "—"}</code>
      </div>
    </div>
  );
}

function StepKeysDemo() {
  const [status, setStatus] = useState("editing");
  const [remountKey, setRemountKey] = useState(0);

  // toggle changes both: status flips AND we increment the transition id.
  function toggleStatus() {
    setStatus(s => (s === "editing" ? "readonly" : "editing"));
    setRemountKey(k => k + 1);
  }

  // cancel-and-restart is the trap: status is intentionally unchanged,
  // only the transition id moves. mirrors "user cancels a draft, returns
  // to the same status".
  function cancelAndRestart() {
    setRemountKey(k => k + 1);
  }

  return (
    <section className="demo">
      <h2>3. Picking the right <code>key</code> — value <em>and</em> placement</h2>
      <h3>Inspired by a PR review where <code>key=&#123;`$&#123;step.id&#125;-$&#123;status&#125;`&#125;</code> was suggested as a remount key. Here's why a state-derived key can silently miss transitions.</h3>

      <div className="cols three">
        <div className="col">
          <header>
            <strong>A. No key</strong>
            <span className="tag bad">never resets</span>
          </header>
          <StepComponent status={status} label="A: no key" />
          <Code highlight={[1]}>{
`<StepComponent status={status} />`
          }</Code>
          <p className="note">React identifies the component by its position. Neither transition resets the draft.</p>
        </div>

        <div className="col">
          <header>
            <strong>B. <code>key=&#123;status&#125;</code></strong>
            <span className="tag warn">misses re-entry</span>
          </header>
          <StepComponent key={status} status={status} label="B: key={status}" />
          <Code highlight={[1]}>{
`<StepComponent key={status} status={status} />`
          }</Code>
          <p className="note">Resets when status flips. <strong>Does not reset</strong> on "cancel &amp; restart" — same status, no new key, draft stays.</p>
        </div>

        <div className="col">
          <header>
            <strong>C. <code>key=&#123;remountKey&#125;</code></strong>
            <span className="tag good">resets on every transition</span>
          </header>
          <StepComponent key={remountKey} status={status} label="C: key={remountKey}" />
          <Code highlight={[1]}>{
`<StepComponent key={remountKey} status={status} />`
          }</Code>
          <p className="note">A monotonic transition id, bumped by the parent on each event that should reset. Doesn't depend on coincidental state changes.</p>
        </div>
      </div>

      <div className="actions">
        <button onClick={toggleStatus}>Toggle status (editing ↔ readonly)</button>
        <button className="ghost" onClick={cancelAndRestart}>Cancel &amp; restart (status unchanged)</button>
        <span className="tag info">remountKey = {remountKey} · status = {status}</span>
      </div>

      <div className="callout">
        <strong>Try it:</strong> type "hello" into all three drafts, then click <em>Cancel &amp; restart</em>.
        Only column C clears. That's the bug the PR author was guarding against — a state-derived key
        like <code>$&#123;step.id&#125;-$&#123;status&#125;</code> can repeat for a transition that genuinely
        needs a fresh component instance.
      </div>

      <h3 style={{ marginTop: 28 }}>Aside: <em>where</em> the key lives matters too</h3>

      <div className="cols">
        <div className="col">
          <header><strong>Key on a wrapper div (reviewer's nudge)</strong></header>
          <Code highlight={[2]}>{
`<div
  key={\`\${step.id}-\${status}\`}
  className="panel"
  ref={panelRef}
>
  <StepComponent ... />
</div>`
          }</Code>
          <p className="note">
            Conflates the wrapper's identity (DOM node, ref, scroll position) with the child's lifecycle.
            Works only if the wrapper's <code>key</code> changes for every transition you care about — which
            brings you right back to the value-of-the-key problem above.
          </p>
        </div>
        <div className="col">
          <header><strong>Key at the call site of the component you want to remount</strong></header>
          <Code highlight={[1]}>{
`<StepComponent key={remountKey} ... />`
          }</Code>
          <p className="note">
            Says exactly what it does: "this <code>StepComponent</code>'s identity is <code>remountKey</code>."
            The wrapper, its ref, and its DOM stay stable; only the component is recreated. That's the placement
            React's docs recommend for resetting state.
          </p>
        </div>
      </div>
    </section>
  );
}

function App() {
  return (
    <>
      <h1>React keys reset state</h1>
      <p className="lead">
        A small live demo of{" "}
        <a
          href="https://react.dev/learn/preserving-and-resetting-state#option-2-resetting-state-with-a-key"
          target="_blank"
          rel="noreferrer"
        >
          “Option 2: Resetting state with a key”
        </a>{" "}
        from the React docs. Each demo shows the JSX diff right under the live example so the cause-and-effect is unambiguous.
      </p>
      <ScoreboardDemo />
      <MessengerDemo />
      <StepKeysDemo />
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
