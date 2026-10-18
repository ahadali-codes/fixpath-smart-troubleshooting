import { ArrowUpRight, Flag, Plus, Search, ThumbsUp } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, send } from "../api";
import {
  Badge,
  Empty,
  ErrorBox,
  Heading,
  Modal,
  Spinner,
} from "../components/UI";
import type { CommunityCase } from "../types";

import { Pagination, useAuth } from "../shared";
export function Community() {
  const { user } = useAuth(),
    navigate = useNavigate();
  const [items, setItems] = useState<CommunityCase[]>([]),
    [total, setTotal] = useState(0),
    [page, setPage] = useState(1),
    [q, setQ] = useState(""),
    [device, setDevice] = useState(""),
    [status, setStatus] = useState(""),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [open, setOpen] = useState<CommunityCase | null>(null),
    [publish, setPublish] = useState(false),
    [report, setReport] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false);
  const refresh = useCallback(() => {
    setLoading(true);
    return api<{ items: CommunityCase[]; total: number }>(
      "/community?" +
        new URLSearchParams({ q, device, status, page: String(page) }),
    )
      .then((d) => {
        setItems(d.items);
        setTotal(d.total);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [q, device, status, page]);
  useEffect(() => {
    const timer = setTimeout(refresh, 200);
    return () => clearTimeout(timer);
  }, [refresh]);
  async function vote(c: CommunityCase) {
    if (!user) {
      navigate("/login?next=/community");
      return;
    }
    setBusy(true);
    try {
      const data = await api<{ helpful: number }>(
        "/community/" + c.id + "/helpful",
        send("POST"),
      );
      setItems((old) =>
        old.map((x) => (x.id === c.id ? { ...x, helpful: data.helpful } : x)),
      );
      setOpen({ ...c, helpful: data.helpful });
      setNotice("Helpful vote updated. Select again to remove your vote.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="page">
      <div className="row between">
        <Heading
          eyebrow="COMMUNITY SOLUTIONS"
          title="What worked for someone else?"
          text="Real-world experiences can offer a starting point. Community contributions are user-reported, not verified technical guidance."
        />
        <button
          className="btn"
          onClick={() =>
            user ? setPublish(true) : navigate("/login?next=/community")
          }
        >
          <Plus size={17} />
          Share an experience
        </button>
      </div>
      <div className="community-filter panel">
        <label className="search-field">
          <Search size={17} />
          <input
            aria-label="Search community solutions"
            placeholder="Search symptoms, fixes or keywords…"
            value={q}
            maxLength={100}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
        </label>
        <select
          aria-label="Filter device"
          value={device}
          onChange={(e) => {
            setDevice(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All devices</option>
          <option value="laptop">Laptop</option>
          <option value="router">Router</option>
        </select>
        <select
          aria-label="Filter outcome"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All outcomes</option>
          <option value="resolved">Resolved</option>
          <option value="unresolved">Unresolved</option>
        </select>
      </div>
      <ErrorBox text={error} />
      {notice && (
        <p role="status" className="success">
          {notice}
        </p>
      )}
      {loading ? (
        <Spinner />
      ) : items.length ? (
        <div className="community-grid">
          {items.map((c) => (
            <button
              className="panel community-card"
              onClick={() => {
                setOpen(c);
                setReport("");
              }}
              key={c.id}
            >
              <div className="row between">
                <Badge tone="muted-badge">{c.device}</Badge>
                <Badge tone={c.resolved ? "cyan" : "orange"}>
                  {c.resolved ? "Resolved" : "Unresolved"}
                </Badge>
              </div>
              <h3>{c.title}</h3>
              <p>{c.symptoms}</p>
              <div className="row between small">
                <span className="muted">
                  {c.sample ? "Fictional example" : "User-reported experience"}
                </span>
                <span className="row">
                  <ThumbsUp size={14} />
                  {c.helpful}
                </span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <Empty>
          <h3>No matching experiences.</h3>
          <p>Try another keyword or device filter.</p>
        </Empty>
      )}
      <Pagination page={page} total={total} size={12} setPage={setPage} />
      {open && (
        <Modal title={open.title} close={() => setOpen(null)}>
          <Badge tone="orange">
            {open.sample ? "FICTIONAL EXAMPLE" : "USER-REPORTED · NOT VERIFIED"}
          </Badge>
          <h3>Reported symptoms</h3>
          <p>{open.symptoms}</p>
          <h3>Checks and fixes attempted</h3>
          <p>{open.fixes}</p>
          <h3>Reported outcome</h3>
          <p>{open.outcome}</p>
          <div className="row between">
            <button
              className="btn secondary"
              disabled={busy}
              onClick={() => vote(open)}
            >
              <ThumbsUp size={16} />
              Helpful · {open.helpful}
            </button>
            <Badge>{open.resolved ? "Resolved" : "Unresolved"}</Badge>
          </div>
          <hr />
          <h3 className="row">
            <Flag size={16} />
            Report this contribution
          </h3>
          <p className="small muted">
            Reports go to a moderator. Reporting does not automatically hide a
            post.
          </p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!user) {
                navigate("/login?next=/community");
                return;
              }
              setBusy(true);
              try {
                await api(
                  "/community/" + open.id + "/report",
                  send("POST", { reason: report }),
                );
                setNotice("Report saved for moderator review.");
                setOpen(null);
              } catch (e) {
                setError((e as Error).message);
                setOpen(null);
              } finally {
                setBusy(false);
              }
            }}
          >
            <label>
              Reason
              <textarea
                required
                minLength={5}
                maxLength={500}
                value={report}
                onChange={(e) => setReport(e.target.value)}
              />
            </label>
            <button className="btn ghost" disabled={busy}>
              Submit report
            </button>
          </form>
        </Modal>
      )}
      {publish && (
        <Modal title="Share your experience" close={() => setPublish(false)}>
          <p className="small muted">
            Only the fields below become public. Do not include private notes,
            emails, addresses or identifying account details.
          </p>
          <ErrorBox text={error} />
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const values = Object.fromEntries(new FormData(e.currentTarget));
              setBusy(true);
              try {
                await api(
                  "/community",
                  send("POST", {
                    ...values,
                    resolved: values.resolved === "true",
                  }),
                );
                setPublish(false);
                setNotice("Your experience was published.");
                refresh();
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <label>
              Title
              <input name="title" required minLength={5} maxLength={120} />
            </label>
            <div className="form-grid">
              <label>
                Device
                <select name="device_id">
                  <option value="laptop">Laptop</option>
                  <option value="router">Router</option>
                </select>
              </label>
              <label>
                Outcome
                <select name="resolved">
                  <option value="false">Unresolved</option>
                  <option value="true">Resolved</option>
                </select>
              </label>
            </div>
            {[
              ["symptoms", "Symptoms"],
              ["fixes", "Checks or fixes you attempted"],
              ["outcome", "What happened afterwards"],
            ].map(([name, label]) => (
              <label key={name}>
                {label}
                <textarea
                  name={name}
                  required
                  minLength={10}
                  maxLength={3000}
                />
              </label>
            ))}
            <button className="btn" disabled={busy}>
              {busy ? "Publishing…" : "Publish experience"}
              <ArrowUpRight size={16} />
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
