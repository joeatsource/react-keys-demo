const { useState } = React;

// Code renders a snippet with line numbers, an optional highlighted line set,
// and inline diff marks: any text wrapped in «…» becomes a <mark>, so the
// changed token within a paired snippet pops without writing JSX-in-JSX.
function Code({ children, highlight }) {
  const lines = String(children).replace(/\n$/, "").split("\n");
  const set = new Set(highlight ?? []);
  return (
    <pre className="code">
      {lines.map((line, i) => {
        const parts = line.split(/(«[^»]*»)/g);
        const rendered = parts.length === 1 && parts[0] === ""
          ? " "
          : parts.map((p, j) =>
              p.startsWith("«") && p.endsWith("»")
                ? <mark key={j} className="diff-add">{p.slice(1, -1)}</mark>
                : <React.Fragment key={j}>{p}</React.Fragment>
            );
        return (
          <span key={i} className={"code-line" + (set.has(i + 1) ? " highlight" : "")}>
            <span className="code-gutter">{i + 1}</span>
            <span className="code-text">{rendered}</span>
          </span>
        );
      })}
    </pre>
  );
}

function Steps({ children }) {
  return <ol className="steps">{children}</ol>;
}

// per-component mount counters. each new mount of that component grabs the
// next integer in its useState lazy initializer, so the badge visibly jumps.
const mountCounters = { Counter: 0, Chat: 0, Step: 0, StepInternal: 0 };
const nextMountId = (k) => ++mountCounters[k];

function Counter({ person }) {
  const [score, setScore] = useState(0);
  const [hover, setHover] = useState(false);
  const [mountId] = useState(() => nextMountId("Counter"));
  return (
    <div
      className={"counter" + (hover ? " hover" : "")}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
    >
      <h4>{person}'s score: {score}</h4>
      <button onClick={() => setScore(score + 1)}>Add one</button>
      <div className="instance-tag">mount #{mountId}</div>
    </div>
  );
}

function ScoreboardDemo() {
  const [isPlayerA, setIsPlayerA] = useState(true);
  const person = isPlayerA ? "Taylor" : "Sarah";
  return (
    <section className="demo">
      <h2>1. Scoreboard</h2>
      <Steps>
        <li>Click <strong>Add one</strong> a few times</li>
        <li>Click <strong>Next player</strong></li>
        <li>Compare the two scores and the <code>mount #</code> badges</li>
      </Steps>
      <div className="cols">
        <div className="col">
          <header>
            <strong>No key</strong>
            <span className="tag bad">state preserved</span>
          </header>
          <Counter person={person} />
          <Code highlight={[11]}>{
`function Counter({ person }) {
  const [score, setScore] = useState(0);
  return (
    <h4>{person}'s score: {score}</h4>
  );
}

function Scoreboard() {
  const [isPlayerA, setIsPlayerA] = useState(true);
  const person = isPlayerA ? "Taylor" : "Sarah";
  return <Counter person={person} />;
}`
          }</Code>
          <p className="note">Same instance across switches — same score.</p>
        </div>
        <div className="col">
          <header>
            <strong><code>key=&#123;person&#125;</code></strong>
            <span className="tag good">state reset</span>
          </header>
          <Counter key={person} person={person} />
          <Code highlight={[11]}>{
`function Counter({ person }) {
  const [score, setScore] = useState(0);
  return (
    <h4>{person}'s score: {score}</h4>
  );
}

function Scoreboard() {
  const [isPlayerA, setIsPlayerA] = useState(true);
  const person = isPlayerA ? "Taylor" : "Sarah";
  return <Counter «key={person} »person={person} />;
}`
          }</Code>
          <p className="note">Key changes per player — fresh instance, score restarts.</p>
        </div>
      </div>
      <div className="actions">
        <button onClick={() => setIsPlayerA(p => !p)}>Next player ({person})</button>
      </div>
    </section>
  );
}

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
  const [mountId] = useState(() => nextMountId("Chat"));
  return (
    <div className="chat">
      <textarea
        value={text}
        placeholder={"Chat to " + contact.name}
        onChange={e => setText(e.target.value)}
      />
      <div className="row">
        <span className="instance-tag">mount #{mountId}</span>
      </div>
    </div>
  );
}

function MessengerDemo() {
  const [toA, setToA] = useState(contacts[0]);
  const [toB, setToB] = useState(contacts[0]);
  return (
    <section className="demo">
      <h2>2. Form draft per recipient</h2>
      <Steps>
        <li>Type a draft into either textarea</li>
        <li>Click a different contact</li>
        <li>Compare the drafts and the <code>mount #</code> badges</li>
      </Steps>
      <div className="cols">
        <div className="col">
          <header>
            <strong>No key</strong>
            <span className="tag bad">draft leaks</span>
          </header>
          <div className="messenger">
            <ContactList selectedId={toA.id} onSelect={setToA} />
            <Chat contact={toA} />
          </div>
          <Code highlight={[16]}>{
`function Chat({ contact }) {
  const [text, setText] = useState("");
  return (
    <textarea
      value={text}
      onChange={e => setText(e.target.value)}
    />
  );
}

function Messenger() {
  const [to, setTo] = useState(contacts[0]);
  return (
    <>
      <ContactList selectedId={to.id} onSelect={setTo} />
      <Chat contact={to} />
    </>
  );
}`
          }</Code>
          <p className="note">Type, switch recipient — same instance, same draft.</p>
        </div>
        <div className="col">
          <header>
            <strong><code>key=&#123;to.id&#125;</code></strong>
            <span className="tag good">resets per recipient</span>
          </header>
          <div className="messenger">
            <ContactList selectedId={toB.id} onSelect={setToB} />
            <Chat key={toB.id} contact={toB} />
          </div>
          <Code highlight={[16]}>{
`function Chat({ contact }) {
  const [text, setText] = useState("");
  return (
    <textarea
      value={text}
      onChange={e => setText(e.target.value)}
    />
  );
}

function Messenger() {
  const [to, setTo] = useState(contacts[0]);
  return (
    <>
      <ContactList selectedId={to.id} onSelect={setTo} />
      <Chat «key={to.id} »contact={to} />
    </>
  );
}`
          }</Code>
          <p className="note">Each recipient gets its own instance, its own draft.</p>
        </div>
      </div>
    </section>
  );
}

function StepComponent({ status }) {
  const [draft, setDraft] = useState("");
  const [mountId] = useState(() => nextMountId("Step"));
  return (
    <div className="step">
      <div className="step-head">
        <span className={"badge " + status}>{status}</span>
        <span className="instance-tag">mount #{mountId}</span>
      </div>
      <textarea
        value={draft}
        placeholder={status === "readonly" ? "(read only)" : "type a draft…"}
        onChange={e => setDraft(e.target.value)}
        readOnly={status === "readonly"}
      />
    </div>
  );
}

// anti-pattern: key on an element *inside* the component you want to reset.
// the parent's useState is one reconciliation scope above and survives.
function StepComponentInternalKey({ status }) {
  const [draft, setDraft] = useState("");
  const [mountId] = useState(() => nextMountId("StepInternal"));
  return (
    <div className="step">
      <div className="step-head">
        <span className={"badge " + status}>{status}</span>
        <span className="instance-tag">mount #{mountId}</span>
      </div>
      <textarea
        key={status}
        value={draft}
        placeholder={status === "readonly" ? "(read only)" : "type a draft…"}
        onChange={e => setDraft(e.target.value)}
        readOnly={status === "readonly"}
      />
    </div>
  );
}

function StepKeysDemo() {
  const [status, setStatus] = useState("editing");
  const [remountKey, setRemountKey] = useState(0);

  function toggleStatus() {
    setStatus(s => (s === "editing" ? "readonly" : "editing"));
    setRemountKey(k => k + 1);
  }
  function cancelAndRestart() {
    setRemountKey(k => k + 1);
  }

  return (
    <section className="demo">
      <h2>3. Picking the right key</h2>
      <Steps>
        <li>Type a draft into each of the five textareas</li>
        <li>Click <strong>Toggle status</strong></li>
        <li>Click <strong>Cancel &amp; restart</strong></li>
        <li>Watch which columns reset and which <code>mount #</code> jumps</li>
      </Steps>
      <div className="legend">
        <div><span className="kbd">Toggle status</span> <span className="legend-effect"><code>status</code> flips · <code>remountKey++</code></span></div>
        <div><span className="kbd">Cancel &amp; restart</span> <span className="legend-effect"><code>status</code> unchanged · <code>remountKey++</code></span></div>
        <div className="legend-takeaway">→ Only a key that changes on <em>both</em> transitions resets state every time.</div>
      </div>

      <div className="cols three">
        <div className="col">
          <header><strong>No key</strong><span className="tag bad">never resets</span></header>
          <StepComponent status={status} />
          <Code highlight={[9]}>{
`function StepComponent({ status }) {
  const [draft, setDraft] = useState("");
  return <textarea value={draft} … />;
}

function Stepper() {
  const [status, setStatus] = useState("editing");

  return <StepComponent status={status} />;
}`
          }</Code>
        </div>
        <div className="col">
          <header><strong><code>key=&#123;status&#125;</code></strong><span className="tag warn">misses re-entry</span></header>
          <StepComponent key={status} status={status} />
          <Code highlight={[9]}>{
`function StepComponent({ status }) {
  const [draft, setDraft] = useState("");
  return <textarea value={draft} … />;
}

function Stepper() {
  const [status, setStatus] = useState("editing");
  // resets only when status itself changes
  return <StepComponent «key={status} »status={status} />;
}`
          }</Code>
        </div>
        <div className="col">
          <header><strong><code>key=&#123;remountKey&#125;</code></strong><span className="tag good">always resets</span></header>
          <StepComponent key={remountKey} status={status} />
          <Code highlight={[10]}>{
`function StepComponent({ status }) {
  const [draft, setDraft] = useState("");
  return <textarea value={draft} … />;
}

function Stepper() {
  const [status, setStatus] = useState("editing");
  «const [remountKey, setRemountKey] = useState(0);»
  // bump remountKey on every transition you want to reset on
  return <StepComponent «key={remountKey} »status={status} />;
}`
          }</Code>
        </div>
      </div>

      <h3>Placement: key on an inner element vs. at the call site</h3>
      <div className="cols">
        <div className="col">
          <header>
            <strong>Anti-pattern: key inside the component</strong>
            <span className="tag bad">no effect on state</span>
          </header>
          <StepComponentInternalKey status={status} />
          <Code highlight={[3, 8]}>{
`function StepComponent({ status }) {
  const [draft, setDraft] = useState("");
  return <textarea «key={status} »value={draft} … />;
}

function Stepper() {
  const [status, setStatus] = useState("editing");
  return <StepComponent status={status} />;
}`
          }</Code>
          <p className="note">
            React rebuilds the textarea DOM, but <code>draft</code> lives in <code>StepComponent</code>'s
            <code>useState</code> one scope up — preserved.
          </p>
        </div>
        <div className="col">
          <header>
            <strong>Correct: key at the call site</strong>
            <span className="tag good">resets the component</span>
          </header>
          <StepComponent key={remountKey} status={status} />
          <Code highlight={[8]}>{
`function StepComponent({ status }) {
  const [draft, setDraft] = useState("");
  return <textarea value={draft} … />;
}

function Stepper() {
  const [remountKey, setRemountKey] = useState(0);
  return <StepComponent «key={remountKey} »status={status} />;
}`
          }</Code>
          <p className="note">
            Parent gives <code>StepComponent</code> a new identity — fresh <code>useState</code>.
          </p>
        </div>
      </div>

      <div className="actions">
        <button onClick={toggleStatus}>Toggle status</button>
        <button className="ghost" onClick={cancelAndRestart}>Cancel &amp; restart</button>
        <span className="tag info">remountKey={remountKey} · status={status}</span>
      </div>
    </section>
  );
}

function App() {
  return (
    <>
      <h1>React keys reset state</h1>
      <p className="lead">
        A live demo of{" "}
        <a
          href="https://react.dev/learn/preserving-and-resetting-state#option-2-resetting-state-with-a-key"
          target="_blank"
          rel="noreferrer"
        >
          resetting state with a key
        </a>
        . Each <code>useState</code> initializes <em>once per mount</em>; a changing <code>key</code>
        is what tells React to mount a fresh instance. The <code>mount&nbsp;#</code> badge increments
        on every mount, and each component briefly flashes when it remounts.
      </p>
      <ScoreboardDemo />
      <MessengerDemo />
      <StepKeysDemo />
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
