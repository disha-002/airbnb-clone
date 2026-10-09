"use client";
import { createContext, useCallback, useContext, useState } from "react";
import HostChoiceModal from "@/components/HostChoiceModal";
import LoginModal from "@/components/LoginModal";

const Ctx = createContext<{ openLogin: () => void; openHostChoice: () => void }>({ openLogin() {}, openHostChoice() {} });
export const useAuthModal = () => useContext(Ctx);

/** Lets any component open the login popup or the "What would you like to host?" popup. */
export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [login, setLogin] = useState(false);
  const [hostChoice, setHostChoice] = useState(false);
  const openLogin = useCallback(() => setLogin(true), []);
  const openHostChoice = useCallback(() => setHostChoice(true), []);
  return (
    <Ctx.Provider value={{ openLogin, openHostChoice }}>
      {children}
      <LoginModal open={login} onClose={() => setLogin(false)} />
      <HostChoiceModal open={hostChoice} onClose={() => setHostChoice(false)} />
    </Ctx.Provider>
  );
}
