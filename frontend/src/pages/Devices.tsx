import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { DeviceArt } from "../components/DeviceArt";
import { Badge, ErrorBox, Heading, Spinner } from "../components/UI";

import { useCatalog } from "../shared";
export function Devices() {
  const { catalog, error } = useCatalog();
  return (
    <div className="page">
      <Heading
        eyebrow="01 / CHOOSE YOUR DEVICE"
        title="What needs a little attention?"
        text="Choose a device. We’ll start with safe checks and follow your answers."
      />
      <ErrorBox text={error} />
      <div className="device-grid">
        {catalog.map((d) => (
          <Link
            key={d.id}
            to={"/devices/" + d.id}
            className="panel device-card"
          >
            <DeviceArt device={d.id} />
            <div className="row between">
              <h2>{d.label}</h2>
              <ArrowUpRight />
            </div>
            <p>
              {d.id === "laptop"
                ? "Power, battery, display and everyday performance."
                : "Connections, coverage and getting back online."}
            </p>
            <div className="row wrap">
              {d.problems.slice(0, 3).map((p) => (
                <Badge key={p.id} tone="muted-badge">
                  {p.title}
                </Badge>
              ))}
            </div>
          </Link>
        ))}
      </div>
      {!catalog.length && !error && <Spinner />}
    </div>
  );
}
