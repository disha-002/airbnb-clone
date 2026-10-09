"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";

interface Ctx {
  users: User[];
  user: User | null;
  ready: boolean;
  login: (id: number) => void;
  logout: () => void;
}
const UserCtx = createContext<Ctx>({ users: [], user: null, ready: false, login() {}, logout() {} });
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

  const logout = useCallback(() => {
    localStorage.removeItem("userId");
    setUser(null);
  }, []);

  return <UserCtx.Provider value={{ users, user, ready, login, logout }}>{children}</UserCtx.Provider>;
}
