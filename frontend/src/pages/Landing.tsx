import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  Check,
  GitBranch,
  Laptop,
  Router as RouterIcon,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { Link } from "react-router-dom";
import { DeviceArt } from "../components/DeviceArt";
import { Badge } from "../components/UI";

export function Landing() {
  return (
    <div className="landing">
      <section className="hero-grid">
        <div className="hero-copy">
          <Badge>
            <span className="live-dot" /> A CLEARER PATH TO WORKING TECH
          </Badge>
          <h1>
            Find the Problem.
            <br />
            <span>Follow the Fix.</span>
          </h1>
          <p>
            Your device has a problem. You don’t need another guess. Work
            through thoughtful checks, understand what you find, and take the
            right next step.
          </p>
          <div className="row hero-buttons">
            <Link to="/devices" className="btn">
              Start Troubleshooting <ArrowRight size={18} />
            </Link>
            <Link to="/community" className="text-link">
              Explore Solutions <ArrowUpRight size={17} />
            </Link>
          </div>
          <div className="hero-trust">
            <span>
              <ShieldCheck size={15} /> Safe, external checks
            </span>
            <span>
              <Bookmark size={15} /> Pick up where you left off
            </span>
          </div>
        </div>
        <div className="hero-visual">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <span className="visual-label">
            <span className="live-dot" /> DIAGNOSTIC WORKSPACE
          </span>
          <DeviceArt large />
          <div className="floating-check">
            <span className="check-icon">
              <Check size={18} />
            </span>
            <div>
              Power source checked<small>One step closer to an answer</small>
            </div>
            <span className="tiny-line" />
          </div>
          <div className="signal-card">
            <Activity size={20} />
            <span>
              Check. Understand.
              <br />
              <strong>Move forward.</strong>
            </span>
          </div>
          <span className="visual-corner">01 / CLARITY STARTS HERE</span>
        </div>
      </section>
      <div className="trust-strip">
        <span>LESS GUESSWORK. MORE DIRECTION.</span>
        <p>
          <Laptop size={18} /> Laptop troubleshooting
        </p>
        <p>
          <RouterIcon size={18} /> Router troubleshooting
        </p>
        <p>
          <GitBranch size={18} /> Answers shape your path
        </p>
      </div>
      <section className="landing-section">
        <div className="row between section-heading">
          <div>
            <span className="eyebrow">LET’S START WITH WHAT’S WRONG</span>
            <h2>Every problem has a starting point.</h2>
          </div>
          <Link to="/devices" className="text-link">
            All device issues <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="issue-grid">
          {[
            {
              title: "Laptop won’t charge",
              text: "Follow the power, one check at a time.",
              device: "laptop",
              icon: <Laptop />,
            },
            {
              title: "Laptop running hot",
              text: "Make space for a cooler head.",
              device: "laptop",
              icon: <Activity />,
            },
            {
              title: "Wi-Fi won’t connect",
              text: "Find where your connection stops.",
              device: "router",
              icon: <RouterIcon />,
            },
            {
              title: "Router won’t power on",
              text: "Start with the simple things.",
              device: "router",
              icon: <Wrench />,
            },
          ].map((issue, i) => (
            <Link
              to={"/devices/" + issue.device}
              className="panel issue-card"
              key={issue.title}
            >
              <span className={"issue-icon accent-" + i}>{issue.icon}</span>
              <h3>{issue.title}</h3>
              <p>{issue.text}</p>
              <span className="issue-arrow">
                <ArrowUpRight size={20} />
              </span>
            </Link>
          ))}
        </div>
      </section>
      <section className="workflow-section">
        <div>
          <span className="eyebrow">A LITTLE STRUCTURE GOES A LONG WAY</span>
          <h2>
            No rabbit holes.
            <br />
            Just your next step.
          </h2>
          <p>
            Each answer shapes what comes next. See your progress, revisit a
            check, and keep a record of what you tried.
          </p>
          <Link to="/devices" className="text-link">
            See where it leads <ArrowRight size={17} />
          </Link>
        </div>
        <div className="workflow-preview">
          {[
            [
              "01",
              "Tell us what’s happening",
              "Choose your device and describe the symptom.",
            ],
            [
              "02",
              "Follow the right checks",
              "Get a relevant question, with context and a safety note.",
            ],
            [
              "03",
              "Leave with a clearer next step",
              "Review possible explanations or take your history to a professional.",
            ],
          ].map(([n, title, text]) => (
            <div className="workflow-step" key={n}>
              <span>{n}</span>
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="honesty">
        <ShieldCheck size={30} />
        <div>
          <h3>Helpful guidance. Honest limits.</h3>
          <p>
            FixPath uses written troubleshooting rules, not remote hardware
            detection. Results are possible explanations based on what you
            report. Hazard signs stop the normal flow; uncertain problems go to
            qualified support.
          </p>
        </div>
      </section>
      <section className="final-cta">
        <span className="eyebrow">YOU DON’T HAVE TO FIGURE IT OUT ALONE</span>
        <h2>Let’s find your next step.</h2>
        <Link className="btn" to="/devices">
          Start Troubleshooting <ArrowRight size={17} />
        </Link>
      </section>
    </div>
  );
}
