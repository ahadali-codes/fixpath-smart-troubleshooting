import { ChevronLeft, ChevronRight } from "lucide-react";
import { createContext, useContext, useEffect, useState } from "react";
import { api } from "./api";
import type { Device, User } from "./types";
export const Auth = createContext<{
  user: User | null;
  setUser: (u: User | null) => void;
  loading: boolean;
}>({ user: null, setUser: () => {}, loading: true });
export const useAuth = () => useContext(Auth);
export const fmt = (value: string | number) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 2,
  }).format(Number(value));
export function time(value: string) {
  return new Date(
    value.endsWith("Z") || /[+-]\d\d:\d\d$/.test(value) ? value : value + "Z",
  ).toLocaleString();
}

export function useCatalog() {
  const [catalog, setCatalog] = useState<Device[]>([]),
    [error, setError] = useState("");
  useEffect(() => {
    api<Device[]>("/catalog")
      .then(setCatalog)
      .catch((e) => setError(e.message));
  }, []);
  return { catalog, error };
}

export function Pagination({
  page,
  total,
  size,
  setPage,
}: {
  page: number;
  total: number;
  size: number;
  setPage: (p: number) => void;
}) {
  return total > size ? (
    <div className="row pagination">
      <button
        className="btn secondary"
        disabled={page === 1}
        onClick={() => setPage(page - 1)}
      >
        <ChevronLeft size={16} />
        Previous
      </button>
      <span className="muted">
        Page {page} of {Math.ceil(total / size)}
      </span>
      <button
        className="btn secondary"
        disabled={page * size >= total}
        onClick={() => setPage(page + 1)}
      >
        Next
        <ChevronRight size={16} />
      </button>
    </div>
  ) : null;
}
