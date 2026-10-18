import { ArrowRight, Laptop, Plus, Router as RouterIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { Badge, Empty, ErrorBox, Heading, Spinner } from "../components/UI";
import type { RepairCase } from "../types";

import { Pagination, time } from "../shared";
export function Cases() {
  const [items, setItems] = useState<RepairCase[]>([]),
    [page, setPage] = useState(1),
    [total, setTotal] = useState(0),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    api<{ items: RepairCase[]; total: number }>("/sessions?page=" + page)
      .then((d) => {
        setItems(d.items);
        setTotal(d.total);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [page]);
  return (
    <div className="page">
      <div className="row between">
        <Heading
          eyebrow="YOUR REPAIR WORKSPACE"
          title="A clearer picture, case by case."
          text="Your checks, notes and next steps stay private until you explicitly write a community contribution."
        />
        <Link to="/devices" className="btn">
          <Plus size={17} /> New case
        </Link>
      </div>
      <ErrorBox text={error} />
      {loading ? (
        <Spinner />
      ) : items.length ? (
        <div className="cases-grid">
          {items.map((c) => (
            <Link to={"/cases/" + c.id} className="panel case-card" key={c.id}>
              <div className="row between">
                <span className="issue-icon">
                  {c.device === "laptop" ? <Laptop /> : <RouterIcon />}
                </span>
                <Badge
                  tone={
                    c.status === "resolved"
                      ? "cyan"
                      : c.status === "paused"
                        ? "orange"
                        : "muted-badge"
                  }
                >
                  {c.status}
                </Badge>
              </div>
              <h3>{c.title}</h3>
              <p>{c.symptoms || c.problem}</p>
              <div className="case-next">
                <ArrowRight size={15} />
                {c.current.terminal ? c.current.result : c.current.question}
              </div>
              <small className="muted">Updated {time(c.updated_at)}</small>
            </Link>
          ))}
        </div>
      ) : (
        <Empty>
          <h3>No repair cases yet.</h3>
          <p>Start with a device and we’ll save your progress here.</p>
          <Link className="btn" to="/devices">
            Start troubleshooting <ArrowRight size={16} />
          </Link>
        </Empty>
      )}
      <Pagination page={page} total={total} size={20} setPage={setPage} />
    </div>
  );
}
