"use client";
import { AuthModalProvider } from "@/context/AuthModalContext";
import { ToastProvider } from "@/context/ToastContext";
import { UserProvider } from "@/context/UserContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <UserProvider>
        <AuthModalProvider>{children}</AuthModalProvider>
      </UserProvider>
    </ToastProvider>
  );
}
