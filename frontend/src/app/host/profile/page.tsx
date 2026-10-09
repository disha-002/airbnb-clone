"use client";
import HostGuard from "@/components/HostGuard";
import ProfileView from "@/components/ProfileView";

/** The host's own profile, opened from the avatar while in hosting mode (keeps the hosting header). */
export default function HostProfilePage() {
  return <HostGuard>{() => <ProfileView hosting />}</HostGuard>;
}
