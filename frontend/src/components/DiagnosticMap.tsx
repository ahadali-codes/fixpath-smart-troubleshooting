import { Check, ChevronRight, GitBranch } from "lucide-react";
import { motion } from "motion/react";
import type { Node, RepairCase } from "../types";
export function DiagnosticMap({
  caseData,
  onReview,
}: {
  caseData: RepairCase;
  onReview: (n: Node) => void;
}) {
  const { path, current, graph } = caseData;
  const future = [
    ...new Set(
      graph.edges.filter((e) => e.from === current.id).map((e) => e.to),
    ),
  ]
    .map((id) => graph.nodes.find((n) => n.id === id)!)
    .filter(Boolean);
  return (
    <section className="panel map">
      <div className="row between">
        <h3>Your diagnostic path</h3>
        <GitBranch size={17} />
      </div>
      <p className="muted small">
        Answers reveal the next branch. Select a completed check to review it.
      </p>
      <ol className="map-path">
        {path.map((n, i) => (
          <li key={n.id} className="done">
            <svg
              className="map-connector"
              viewBox="0 0 26 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <motion.path
                d="M13 0 L13 100"
                fill="none"
                stroke="#4bada3"
                strokeWidth="1"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.35 }}
              />
            </svg>
            <button onClick={() => onReview(n)}>
              <span className="node-dot">
                <Check size={13} />
              </span>
              <span>
                <strong>{i === 0 ? "Safety check" : n.question}</strong>
                <small>{n.answer}</small>
              </span>
            </button>
          </li>
        ))}
        <li className="current">
          <span className="node-dot pulse">{path.length + 1}</span>
          <span>
            <strong>
              {current.terminal ? "Recommended next step" : current.question}
            </strong>
            <small>Current {current.terminal ? "result" : "check"}</small>
          </span>
        </li>
      </ol>
      {!current.terminal && (
        <div className="future-branches">
          {future.map((n) => (
            <div key={n.id} className="future-node">
              <ChevronRight size={13} />
              {n.terminal ? n.result : n.question}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
