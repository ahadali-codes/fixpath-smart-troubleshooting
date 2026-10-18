import { ArrowRight, Check, ChevronLeft } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { api, send } from "../api";
import { DeviceArt } from "../components/DeviceArt";
import { ErrorBox, Heading } from "../components/UI";
import type { RepairCase } from "../types";

import { useAuth, useCatalog } from "../shared";
export function Problems() {
  const { deviceId } = useParams(),
    { catalog, error } = useCatalog(),
    { user } = useAuth(),
    navigate = useNavigate(),
    location = useLocation();
  const [selected, setSelected] = useState(""),
    [symptoms, setSymptoms] = useState(""),
    [failure, setFailure] = useState(""),
    [busy, setBusy] = useState(false);
  const device = catalog.find((d) => d.id === deviceId);
  async function start() {
    if (!user) {
      navigate("/login?next=" + encodeURIComponent(location.pathname));
      return;
    }
    setBusy(true);
    try {
      const c = await api<RepairCase>(
        "/sessions",
        send("POST", { problem_id: selected, symptoms }),
      );
      navigate("/cases/" + c.id);
    } catch (e) {
      setFailure((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="page">
      <Link to="/devices" className="back-link">
        <ChevronLeft size={16} /> Change device
      </Link>
      <Heading
        eyebrow="02 / DESCRIBE THE PROBLEM"
        title={
          device
            ? `What’s happening with your ${device.id}?`
            : "Choose a device issue"
        }
        text="Choose the closest symptom. You can add details before starting."
      />
      <ErrorBox text={error || failure} />
      <div className="problem-layout">
        <div className="problem-grid">
          {device?.problems.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setSelected(p.id)}
              className={
                "panel problem-card " + (selected === p.id ? "selected" : "")
              }
            >
              <span className="problem-number">0{i + 1}</span>
              <h3>{p.title}</h3>
              <p>{p.description}</p>
              {selected === p.id && (
                <Check className="selected-check" size={20} />
              )}
            </button>
          ))}
        </div>
        <aside className="panel start-panel">
          <DeviceArt device={deviceId} />
          <h3>Your words help tell the story.</h3>
          <label>
            Additional symptoms <span className="muted">(optional)</span>
            <textarea
              maxLength={2000}
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="When did it start? What have you noticed?"
            />
          </label>
          <p className="small muted">
            Your description is saved as context. Questions follow the selected
            issue’s rules; free text is not AI-analyzed.
          </p>
          <button
            className="btn full"
            disabled={!selected || busy}
            onClick={start}
          >
            {busy
              ? "Starting…"
              : user
                ? "Start diagnostic"
                : "Sign in to save & start"}
            <ArrowRight size={17} />
          </button>
        </aside>
      </div>
      {catalog.length > 0 && !device && (
        <p>Device not found. Choose Laptop or Router.</p>
      )}
    </div>
  );
}
