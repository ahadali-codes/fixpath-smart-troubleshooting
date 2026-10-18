import { ArrowUpRight, GitBranch, LogOut, Menu, X } from "lucide-react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter,
  Link,
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { api, send } from "./api";
import { ErrorBox, Heading, Spinner } from "./components/UI";
import "./styles.css";
import type { User } from "./types";

import { Account } from "./pages/Account";
import { AuthPage } from "./pages/AuthPage";
import { Cases } from "./pages/Cases";
import { Community } from "./pages/Community";
import { CostPage } from "./pages/CostPage";
import { Devices } from "./pages/Devices";
import { Landing } from "./pages/Landing";
import { Problems } from "./pages/Problems";
import { Wizard } from "./pages/Wizard";
import { Auth, useAuth } from "./shared";
function App() {
  const [user, setUser] = useState<User | null>(null),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    const handler = () => setUser(null);
    window.addEventListener("fixpath:unauthorized", handler);
    return () => window.removeEventListener("fixpath:unauthorized", handler);
  }, []);
  useEffect(() => {
    api<User>("/auth/me")
      .then(setUser)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  return (
    <Auth.Provider value={{ user, setUser, loading }}>
      <BrowserRouter>
        <MotionConfig reducedMotion="user">
          <Shell />
        </MotionConfig>
      </BrowserRouter>
    </Auth.Provider>
  );
}
function Shell() {
  const { user, setUser } = useAuth(),
    navigate = useNavigate(),
    location = useLocation();
  const [mobile, setMobile] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    setMobile(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <header className="topbar">
        <Link to="/" className="logo">
          <span className="logo-symbol">
            <GitBranch size={22} />
          </span>
          fixpath<span className="logo-dot">.</span>
        </Link>
        <nav className={mobile ? "open" : ""} aria-label="Main navigation">
          <NavLink to="/devices">Troubleshoot</NavLink>
          <NavLink to="/community">Community</NavLink>
          <NavLink to="/calculator">Repair or replace</NavLink>
          {user && <NavLink to="/cases">My cases</NavLink>}
        </nav>
        <div className="nav-actions">
          {user ? (
            <>
              <Link
                className="avatar"
                to="/settings"
                aria-label="Account settings"
              >
                {user.name.slice(0, 1).toUpperCase()}
              </Link>
              <button
                className="icon-button logout"
                title="Sign out"
                aria-label="Sign out"
                onClick={async () => {
                  try {
                    await api("/auth/logout", send("POST"));
                    setUser(null);
                    navigate("/");
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <Link className="btn small-btn secondary" to="/login">
              Sign in <ArrowUpRight size={15} />
            </Link>
          )}
          <button
            className="icon-button mobile-menu"
            aria-label="Toggle navigation"
            aria-expanded={mobile}
            onClick={() => setMobile(!mobile)}
          >
            {mobile ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      <main id="main">
        <ErrorBox text={error} />
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
          >
            <Routes location={location}>
              <Route path="/" element={<Landing />} />
              <Route path="/devices" element={<Devices />} />
              <Route path="/devices/:deviceId" element={<Problems />} />
              <Route path="/login" element={<AuthPage />} />
              <Route path="/register" element={<AuthPage register />} />
              <Route
                path="/cases"
                element={
                  <Private>
                    <Cases />
                  </Private>
                }
              />
              <Route
                path="/cases/:id"
                element={
                  <Private>
                    <Wizard />
                  </Private>
                }
              />
              <Route
                path="/calculator"
                element={
                  <Private>
                    <CostPage />
                  </Private>
                }
              />
              <Route path="/community" element={<Community />} />
              <Route
                path="/settings"
                element={
                  <Private>
                    <Account />
                  </Private>
                }
              />
              <Route
                path="*"
                element={
                  <div className="page">
                    <Heading eyebrow="404" title="That path doesn’t exist." />
                    <Link to="/" className="btn">
                      Back to FixPath
                    </Link>
                  </div>
                }
              />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>
      <footer className="footer">
        <Link to="/" className="logo">
          fixpath<span className="logo-dot">.</span>
        </Link>
        <span>Better checks. Clearer next steps.</span>
        <span>Guidance, never a confirmed diagnosis.</span>
      </footer>
    </>
  );
}
function Private({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth(),
    location = useLocation();
  if (loading) return <Spinner />;
  return user ? (
    <>{children}</>
  ) : (
    <Navigate
      to={"/login?next=" + encodeURIComponent(location.pathname)}
      replace
    />
  );
}
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
