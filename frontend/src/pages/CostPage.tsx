import { ArrowRight, ArrowUpRight, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { api, send } from "../api";
import { DeviceArt } from "../components/DeviceArt";
import { Badge, ErrorBox, Heading } from "../components/UI";
import type { Cost } from "../types";

import { fmt, time } from "../shared";
export function CostPage() {
  const location = useLocation();
  const [values, setValues] = useState({
      repair: "",
      extra: "0",
      replacement: "",
      age: "0",
      warranty: "",
    }),
    [result, setResult] = useState<Cost | null>(null),
    [items, setItems] = useState<Cost[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const refresh = () =>
    api<{ items: Cost[] }>("/comparisons")
      .then((d) => setItems(d.items))
      .catch((e) => setError(e.message));
  useEffect(() => {
    refresh();
  }, []);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await api<Cost>(
        "/comparisons",
        send("POST", {
          ...values,
          session_id: new URLSearchParams(location.search).get("case"),
        }),
      );
      setResult(r);
      refresh();
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="page">
      <Heading
        eyebrow="REPAIR OR REPLACE"
        title="Put the estimates side by side."
        text="A clearer comparison, not a decision made for you. All amounts are your own estimates in PKR."
      />
      <ErrorBox text={error} />
      <div className="details-grid">
        <section className="panel">
          <h2>Your estimates</h2>
          <form onSubmit={submit}>
            {[
              {
                key: "repair",
                label: "Estimated repair cost (PKR)",
                min: 0,
                step: ".01",
              },
              {
                key: "replacement",
                label: "Replacement device cost (PKR)",
                min: 0.01,
                step: ".01",
              },
              {
                key: "extra",
                label: "Additional expected repair expenses (PKR)",
                min: 0,
                step: ".01",
              },
              { key: "age", label: "Device age (years)", min: 0, step: ".1" },
            ].map((f) => (
              <label key={f.key}>
                {f.label}
                <input
                  type="number"
                  required
                  min={f.min}
                  max={f.key === "age" ? 100 : 1000000000}
                  step={f.step}
                  value={values[f.key as keyof typeof values]}
                  onChange={(e) =>
                    setValues({ ...values, [f.key]: e.target.value })
                  }
                />
              </label>
            ))}
            <label>
              Warranty or coverage information (optional)
              <textarea
                value={values.warranty}
                onChange={(e) =>
                  setValues({ ...values, warranty: e.target.value })
                }
                maxLength={500}
              />
            </label>
            <button className="btn" disabled={busy}>
              {busy ? "Saving…" : "Compare & save"}
              <ArrowRight size={16} />
            </button>
          </form>
        </section>
        <section className="panel cost-result">
          <Badge tone="orange">USER-PROVIDED ESTIMATES</Badge>
          <h2>
            {result
              ? "A comparison worth considering."
              : "The numbers are one part of the picture."}
          </h2>
          {result ? (
            <>
              <div className="cost-bars">
                {[
                  {
                    label: "Repair + additional costs",
                    value: result.total_repair,
                    cls: "repair",
                  },
                  {
                    label: "Replacement device",
                    value: result.replacement,
                    cls: "replace",
                  },
                ].map((v) => (
                  <div key={v.label}>
                    <div className="row between">
                      <span>{v.label}</span>
                      <strong>{fmt(v.value)}</strong>
                    </div>
                    <div className="progress">
                      <motion.div
                        className={v.cls}
                        animate={{
                          width:
                            Math.max(
                              2,
                              (Number(v.value) /
                                Math.max(
                                  Number(result.total_repair),
                                  Number(result.replacement),
                                )) *
                                100,
                            ) + "%",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <h3>
                {Number(result.difference) === 0
                  ? "The estimates are equal."
                  : `${fmt(Math.abs(Number(result.difference)))} estimated difference`}
              </h3>
              <p>
                {Number(result.difference) > 0
                  ? "The estimated repair total is lower than the replacement estimate."
                  : Number(result.difference) < 0
                    ? "The estimated repair total is higher than the replacement estimate."
                    : "Neither estimate is lower."}
              </p>
              <p className="small muted">
                Device age: {result.age} years.{" "}
                {result.warranty && `Coverage note: ${result.warranty}`}
              </p>
            </>
          ) : (
            <DeviceArt device="laptop" />
          )}
          <div className="safety">
            <ShieldCheck size={20} />
            <span>
              Price alone does not determine the best choice. Consider warranty
              coverage, reliability, device age and what you need. FixPath does
              not assess the device’s actual condition.
            </span>
          </div>
        </section>
      </div>
      <section className="panel mt">
        <h3>Your recent saved comparisons</h3>
        {items.length ? (
          <div className="comparison-list">
            {items.map((i) => (
              <button
                className="comparison-row"
                key={i.id}
                onClick={() => setResult(i)}
              >
                <span>{time(i.created_at)}</span>
                <span>Repair {fmt(i.total_repair)}</span>
                <span>Replace {fmt(i.replacement)}</span>
                <ArrowUpRight size={16} />
              </button>
            ))}
          </div>
        ) : (
          <p className="muted">Your saved comparisons will appear here.</p>
        )}
        <p className="small muted">Showing the latest 20 comparisons.</p>
      </section>
    </div>
  );
}
