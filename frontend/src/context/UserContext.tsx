"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";

export interface AccountForm { first_name: string; last_name: string; date_of_birth: string; marketing_opt_out: boolean }

interface Ctx {
  users: User[];
  user: User | null;
  ready: boolean;
  login: (id: number) => void;
  /**
   * Log in with any email: unknown addresses get a fresh guest account. Accounts still waiting
   * on "Let's create your account" are returned but not logged in until completeAccount().
   */
  loginWithEmail: (email: string) => Promise<User>;
  completeAccount: (id: number, form: AccountForm) => Promise<User>;
  logout: () => void;
  /** Publishing a first listing makes a guest a host (the API already switched the role). */
  becomeHost: () => void;
}
const UserCtx = createContext<Ctx>({ users: [], user: null, ready: false, login() {}, loginWithEmail: async () => { throw new Error("no provider"); }, completeAccount: async () => { throw new Error("no provider"); }, logout() {}, becomeHost() {} });
export const useUser = () => useContext(UserCtx);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    api<User[]>("/users")
      .then((list) => {
        setUsers(list);
        const saved = localStorage.getItem("userId");
        setUser(list.find((u) => String(u.id) === saved) ?? null);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const login = useCallback((id: number) => {
    localStorage.setItem("userId", String(id));
    setUser(users.find((u) => u.id === id) ?? null);
  }, [users]);

  const signIn = useCallback((u: User) => {
    setUsers((list) => (list.some((x) => x.id === u.id) ? list.map((x) => (x.id === u.id ? u : x)) : [...list, u]));
    localStorage.setItem("userId", String(u.id));
    setUser(u);
  }, []);

  const loginWithEmail = useCallback(async (email: string) => {
    const u = await api<User>("/login", { method: "POST", body: JSON.stringify({ email }) });
    if (u.account_complete !== false) signIn(u);
    return u;
  }, [signIn]);

  const completeAccount = useCallback(async (id: number, form: AccountForm) => {
    const u = await api<User>("/me", { method: "PATCH", body: JSON.stringify(form), headers: { "X-User-Id": String(id) } });
    signIn(u);
    return u;
  }, [signIn]);

  const logout = useCallback(() => {
    localStorage.removeItem("userId");
    setUser(null);
  }, []);

  const becomeHost = useCallback(() => {
    setUser((u) => (u && u.role !== "host" ? { ...u, role: "host" } : u));
    setUsers((list) => list.map((x) => (x.id === user?.id ? { ...x, role: "host" } : x)));
  }, [user?.id]);

  return <UserCtx.Provider value={{ users, user, ready, login, loginWithEmail, completeAccount, logout, becomeHost }}>{children}</UserCtx.Provider>;
}
