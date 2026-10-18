import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { api, send } from "../api";
import { Badge, ErrorBox, Heading, Modal } from "../components/UI";
import type { CommunityCase, User } from "../types";

import { useAuth } from "../shared";
export function Account() {
  const { user, setUser } = useAuth();
  const [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [mine, setMine] = useState<CommunityCase[]>([]),
    [reports, setReports] = useState<any[]>([]),
    [remove, setRemove] = useState<string | null>(null);
  const refresh = () => {
    api<{ items: CommunityCase[] }>("/community/mine")
      .then((d) => setMine(d.items))
      .catch((e) => setError(e.message));
    if (user?.is_admin)
      api("/admin/reports")
        .then((d) => setReports(d.items))
        .catch((e) => setError(e.message));
  };
  useEffect(refresh, [user?.is_admin]);
  return (
    <div className="page">
      <Heading
        eyebrow="ACCOUNT SETTINGS"
        title="Your workspace. Your choices."
        text="Manage your profile and the experiences you’ve chosen to share."
      />
      <ErrorBox text={error} />
      {notice && (
        <p role="status" className="success">
          {notice}
        </p>
      )}
      <div className="details-grid">
        <section className="panel">
          <h2>Your profile</h2>
          <p className="muted">{user?.email}</p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                const data = Object.fromEntries(new FormData(e.currentTarget));
                setUser(await api<User>("/auth/me", send("PATCH", data)));
                setNotice("Profile saved.");
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            <label>
              Display name
              <input
                name="name"
                defaultValue={user?.name}
                minLength={2}
                maxLength={80}
                required
              />
            </label>
            <button className="btn secondary">Save profile</button>
          </form>
        </section>
        <section className="panel">
          <h2>Change password</h2>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget;
              try {
                await api(
                  "/auth/password",
                  send("POST", Object.fromEntries(new FormData(form))),
                );
                setNotice("Password changed. Other sessions were signed out.");
                form.reset();
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            <label>
              Current password
              <input
                name="current_password"
                type="password"
                autoComplete="current-password"
                required
              />
            </label>
            <label>
              New password
              <input
                name="new_password"
                type="password"
                minLength={10}
                maxLength={128}
                autoComplete="new-password"
                required
              />
            </label>
            <button className="btn secondary">Change password</button>
          </form>
        </section>
      </div>
      <section className="panel mt">
        <h2>Your community contributions</h2>
        {mine.length ? (
          mine.map((c) => (
            <div className="contribution-row" key={c.id}>
              <div>
                <h3>{c.title}</h3>
                <span className="small muted">
                  {c.hidden
                    ? "Hidden by moderator"
                    : c.resolved
                      ? "Resolved"
                      : "Unresolved"}
                </span>
              </div>
              <button
                className="icon-button"
                aria-label={"Delete contribution " + c.title}
                onClick={() => setRemove(c.id)}
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))
        ) : (
          <p className="muted">
            No public contributions yet. Your private cases are separate.
          </p>
        )}
      </section>
      {user?.is_admin && (
        <section className="panel mt">
          <h2>Moderator report queue</h2>
          {reports.length ? (
            reports.map((r) => (
              <div className="report-row" key={r.id}>
                <h3>{r.case_title}</h3>
                <p>{r.reason}</p>
                <Badge tone={r.reviewed ? "muted-badge" : "orange"}>
                  {r.reviewed ? "Reviewed" : "Pending"}
                </Badge>
                <button
                  className="btn secondary"
                  onClick={async () => {
                    try {
                      await api(
                        "/admin/community/" + r.case_id,
                        send("PATCH", { hidden: !r.hidden }),
                      );
                      setNotice("Moderation decision saved.");
                      refresh();
                    } catch (e) {
                      setError((e as Error).message);
                    }
                  }}
                >
                  {r.hidden ? "Restore post" : "Hide post"}
                </button>
              </div>
            ))
          ) : (
            <p className="muted">No reports to review.</p>
          )}
        </section>
      )}
      {remove && (
        <Modal
          title="Delete this public contribution?"
          close={() => setRemove(null)}
        >
          <p>
            This deletes the post and its votes and reports. Your private cases
            remain separate.
          </p>
          <button
            className="btn danger"
            onClick={async () => {
              try {
                await api("/community/" + remove, send("DELETE"));
                setRemove(null);
                refresh();
              } catch (e) {
                setError((e as Error).message);
                setRemove(null);
              }
            }}
          >
            Delete contribution
          </button>
        </Modal>
      )}
    </div>
  );
}
