import { ArrowRight } from "lucide-react";
import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api, send } from "../api";
import { DeviceArt } from "../components/DeviceArt";
import { ErrorBox, Heading } from "../components/UI";
import type { User } from "../types";

import { useAuth } from "../shared";
export function AuthPage({ register = false }: { register?: boolean }) {
  const { setUser } = useAuth(),
    navigate = useNavigate(),
    location = useLocation();
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const values = Object.fromEntries(new FormData(e.currentTarget));
    setBusy(true);
    setError("");
    try {
      const user = await api<User>(
        "/auth/" + (register ? "register" : "login"),
        send("POST", values),
      );
      setUser(user);
      const next = new URLSearchParams(location.search).get("next");
      navigate(
        next?.startsWith("/") && !next.startsWith("//") ? next : "/cases",
      );
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-layout">
      <div className="auth-story">
        <span className="eyebrow">A LITTLE CLARITY. SAVED FOR LATER.</span>
        <h1>
          Your next step,
          <br />
          <span className="cyan-text">right where you left it.</span>
        </h1>
        <DeviceArt device="router" />
        <p>
          Private repair cases. A history that makes sense. No more starting
          from scratch.
        </p>
      </div>
      <section className="panel auth-panel">
        <Heading
          eyebrow="YOUR FIXPATH ACCOUNT"
          title={register ? "Make a clearer start." : "Welcome back."}
          text={
            register
              ? "Create your private troubleshooting workspace."
              : "Sign in to pick up your diagnostic path."
          }
        />
        <ErrorBox text={error} />
        <form onSubmit={submit}>
          {register && (
            <label>
              Your name
              <input
                name="name"
                required
                minLength={2}
                maxLength={80}
                autoComplete="name"
              />
            </label>
          )}
          <label>
            Email address
            <input type="email" name="email" required autoComplete="email" />
          </label>
          <label>
            Password
            <input
              type="password"
              name="password"
              minLength={register ? 10 : 1}
              maxLength={128}
              required
              autoComplete={register ? "new-password" : "current-password"}
            />
          </label>
          {register && (
            <p className="small muted">
              Use at least 10 characters. No email verification or password
              recovery is provided in this local version.
            </p>
          )}
          <button className="btn full" disabled={busy}>
            {busy ? "Please wait…" : register ? "Create account" : "Sign in"}
            <ArrowRight size={17} />
          </button>
        </form>
        <p className="small muted">
          {register ? "Already have an account?" : "New here?"}{" "}
          <Link
            className="cyan-text"
            to={(register ? "/login" : "/register") + location.search}
          >
            {register ? "Sign in" : "Create an account"}
          </Link>
        </p>
      </section>
    </div>
  );
}
