"use client";
import HostGuard from "@/components/HostGuard";
import ListingForm from "@/components/ListingForm";

export default function NewListingPage() {
  return <HostGuard>{() => <ListingForm />}</HostGuard>;
}
