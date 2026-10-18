import {
  ArrowRight,
  Calculator as CalculatorIcon,
  Check,
  ChevronLeft,
  Clock3,
  Pause,
  Play,
  Plus,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, send } from "../api";
import { DeviceArt } from "../components/DeviceArt";
import { DiagnosticMap } from "../components/DiagnosticMap";
import { Badge, ErrorBox, Modal, Spinner } from "../components/UI";
import type { Node, RepairCase } from "../types";

import { time } from "../shared";
export function Wizard() {
  const { id } = useParams(),
    navigate = useNavigate();
  const [c, setC] = useState<RepairCase | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [selected, setSelected] = useState(""),
    [review, setReview] = useState<Node | null>(null),
    [tab, setTab] = useState("Guide"),
    [note, setNote] = useState(""),
    [rename, setRename] = useState(""),
    [deleting, setDeleting] = useState(false);
  useEffect(() => {
    api<RepairCase>("/sessions/" + id)
      .then(setC)
      .catch((e) => setError(e.message));
  }, [id]);
  async function action(path: string, method: string, data?: unknown) {
    setBusy(true);
    setError("");
    try {
      const updated = await api<RepairCase>(
        "/sessions/" + id + path,
        send(method, data),
      );
      setC(updated);
      setSelected("");
      setReview(null);
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  if (!c)
    return (
      <div className="page">
        <ErrorBox text={error} />
        {!error && <Spinner />}
      </div>
    );
  const current = review || c.current;
  const completed = c.path.length;
  const graph = c.graph;
  function remaining(n: string, seen = new Set<string>()): number {
    if (seen.has(n)) return 0;
    const children = graph.edges.filter((e) => e.from === n);
    return children.length
      ? 1 +
          Math.max(
            ...children.map((e) => remaining(e.to, new Set([...seen, n]))),
          )
      : 0;
  }
  const stepsLeft = remaining(c.current.id);
  const progress = c.current.terminal
    ? 100
    : Math.round((completed / (completed + stepsLeft || 1)) * 100);
  return (
    <div className="page">
      <Link className="back-link" to="/cases">
        <ChevronLeft size={16} /> My cases
      </Link>
      <div className="row between">
        <div>
          <div className="row">
            <Badge>{c.device}</Badge>
            <Badge tone="muted-badge">{c.status}</Badge>
          </div>
          <h1 className="case-title">{c.title}</h1>
        </div>
        <button
          className="btn secondary"
          disabled={busy}
          onClick={() =>
            action("", "PATCH", {
              status: c.status === "paused" ? "active" : "paused",
            })
          }
        >
          {c.status === "paused" ? <Play size={16} /> : <Pause size={16} />}{" "}
          {c.status === "paused" ? "Resume case" : "Pause & save"}
        </button>
      </div>
      <ErrorBox text={error} />
      <div className="tabs" role="tablist">
        {["Guide", "Timeline", "Case details"].map((t) => (
          <button
            role="tab"
            aria-selected={tab === t}
            key={t}
            className={tab === t ? "active" : ""}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "Guide" ? (
        <div className="wizard-layout">
          <div>
            <section className="panel question-panel">
              <div className="row between">
                <span className="eyebrow">
                  {review
                    ? "REVIEW A PREVIOUS CHECK"
                    : c.current.terminal
                      ? "YOUR NEXT STEP"
                      : `CHECK ${completed + 1}`}
                </span>
                <span className="small muted">{completed} checks saved</span>
              </div>
              <div className="progress">
                <motion.div animate={{ width: progress + "%" }} />
              </div>
              <p className="small muted">
                Path progress · updates as your answers reveal branches
              </p>
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.id + (review ? "review" : "current")}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                >
                  {current.terminal ? (
                    <>
                      <span className="result-icon">
                        <ShieldCheck size={28} />
                      </span>
                      <h2>{current.result}</h2>
                      <p>{current.explanation}</p>
                      <div className="recommendation">
                        <h3>Recommended next action</h3>
                        <p>{current.recommendation}</p>
                      </div>
                      <div className="row wrap">
                        <button
                          className="btn"
                          disabled={busy || c.status === "paused"}
                          onClick={() =>
                            action("", "PATCH", { status: "resolved" })
                          }
                        >
                          <Check size={16} /> Mark resolved
                        </button>
                        <button
                          className="btn secondary"
                          disabled={busy || c.status === "paused"}
                          onClick={() =>
                            action("", "PATCH", { status: "unresolved" })
                          }
                        >
                          Still unresolved
                        </button>
                      </div>
                      <p className="small muted">
                        Resolution is your report, not a verified diagnosis.
                      </p>
                    </>
                  ) : (
                    <>
                      <h2>{current.question}</h2>
                      <p>{current.explanation}</p>
                      {current.safety && (
                        <div className="safety">
                          <ShieldCheck size={19} />
                          <span>{current.safety}</span>
                        </div>
                      )}
                      <fieldset
                        className="answers"
                        disabled={busy || c.status === "paused"}
                      >
                        <legend className="sr-only">Select your answer</legend>
                        {current.options.map((option) => (
                          <label
                            className={
                              "answer " + (selected === option ? "chosen" : "")
                            }
                            key={option}
                          >
                            <input
                              type="radio"
                              name="answer"
                              checked={selected === option}
                              onChange={() => setSelected(option)}
                            />
                            <span>{option}</span>
                            <span className="radio-dot" />
                          </label>
                        ))}
                      </fieldset>
                      {review && (
                        <p className="small orange-text">
                          Previous answer: {review.answer}. Saving a different
                          answer archives later checks and recalculates your
                          path.
                        </p>
                      )}
                      <div className="row between">
                        <button
                          className="btn ghost"
                          disabled={!review && !c.path.length}
                          onClick={() => {
                            if (review) {
                              setReview(null);
                              setSelected("");
                            } else {
                              setReview(c.path[c.path.length - 1]);
                              setSelected("");
                            }
                          }}
                        >
                          <ChevronLeft size={16} />
                          {review ? "Back to current check" : "Back"}
                        </button>
                        <button
                          className="btn"
                          disabled={!selected || busy || c.status === "paused"}
                          onClick={() =>
                            action("/answers", "POST", {
                              node_id: current.id,
                              answer: selected,
                              version: c.version,
                            })
                          }
                        >
                          {busy
                            ? "Saving…"
                            : review
                              ? "Update answer"
                              : "Continue"}
                          <ArrowRight size={17} />
                        </button>
                      </div>
                    </>
                  )}
                  {c.status === "paused" && (
                    <div className="safety">
                      This case is paused. Resume it above to continue.
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </section>
            <section className="panel notes-panel">
              <h3>Keep a note</h3>
              <p className="small muted">
                What did you try? What happened? Notes stay private.
              </p>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (await action("/notes", "POST", { text: note }))
                    setNote("");
                }}
              >
                <textarea
                  aria-label="Private note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={2000}
                  required
                  placeholder="Add a check you attempted or an observation…"
                />
                <button
                  className="btn secondary"
                  disabled={busy || !note.trim()}
                >
                  Save private note <Plus size={15} />
                </button>
              </form>
            </section>
          </div>
          <aside>
            <div className="panel illustration-panel">
              <Badge tone="muted-badge">COMPONENT GUIDE</Badge>
              <DeviceArt device={c.device} component={current.component} />
              <p className="small muted">
                Highlights identify a location to inspect. They cannot detect a
                physical fault.
              </p>
            </div>
            <DiagnosticMap
              caseData={c}
              onReview={(n) => {
                setReview(n);
                setSelected("");
              }}
            />
          </aside>
        </div>
      ) : tab === "Timeline" ? (
        <section className="panel">
          <h2>Your repair timeline</h2>
          <ol className="timeline">
            {c.events.map((event) => (
              <li key={event.id}>
                <span className="node-dot">
                  <Clock3 size={13} />
                </span>
                <div>
                  <span className="eyebrow">
                    {event.kind.replace("_", " ")}
                  </span>
                  <p>{event.text}</p>
                  <small className="muted">{time(event.created_at)}</small>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : (
        <div className="details-grid">
          <section className="panel">
            <h2>Case details</h2>
            <p>{c.symptoms || "No additional symptoms reported."}</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                action("", "PATCH", { title: rename });
              }}
            >
              <label>
                Rename case
                <input
                  required
                  value={rename}
                  placeholder={c.title}
                  maxLength={120}
                  onChange={(e) => setRename(e.target.value)}
                />
              </label>
              <button
                className="btn secondary"
                disabled={busy || !rename.trim()}
              >
                Save name
              </button>
            </form>
            <h3 className="mt">Saved notes</h3>
            {c.notes.length ? (
              c.notes.map((n) => (
                <div className="saved-note" key={n.id}>
                  <p>{n.text}</p>
                  <small className="muted">{time(n.created_at)}</small>
                </div>
              ))
            ) : (
              <p className="muted">No notes yet.</p>
            )}
          </section>
          <section className="panel">
            <h3>Keep control of your case</h3>
            <p>
              Nothing here is public. To share an experience, write a separate
              contribution in Community.
            </p>
            <Link className="btn secondary" to={"/calculator?case=" + c.id}>
              Compare repair costs
              <CalculatorIcon size={16} />
            </Link>
            <button className="btn danger mt" onClick={() => setDeleting(true)}>
              <Trash2 size={16} />
              Delete this case
            </button>
          </section>
        </div>
      )}
      {deleting && (
        <Modal
          title="Delete this private case?"
          close={() => setDeleting(false)}
        >
          <p>
            This permanently removes its answers, events and notes. Public
            contributions are separate.
          </p>
          <button
            className="btn danger"
            onClick={async () => {
              try {
                await api("/sessions/" + id, send("DELETE"));
                navigate("/cases");
              } catch (e) {
                setError((e as Error).message);
                setDeleting(false);
              }
            }}
          >
            Delete case permanently
          </button>
        </Modal>
      )}
    </div>
  );
}
