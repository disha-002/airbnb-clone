"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import type { ConversationDetail, ListingDetail } from "@/lib/types";
import Modal from "./Modal";
import Avatar from "./Avatar";

/* eslint-disable @next/next/no-img-element */
/** "Message host" from a listing page: sends the first message, then opens the conversation. */
export default function ContactHostModal({ listing, open, onClose }: { listing: ListingDetail; open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const host = listing.host.name.split(" ")[0];

  const send = async () => {
    if (!body.trim()) { setError(`Write a message to ${host}.`); return; }
    setSending(true); setError(null);
    try {
      const c = await api<ConversationDetail>("/conversations", { method: "POST", body: JSON.stringify({ listing_id: listing.id, body }) });
      setBody("");
      onClose();
      router.push(`/messages?c=${c.id}`);
    } catch (e) { setError((e as Error).message); }
    setSending(false);
  };

  return (
    <Modal open={open} onClose={() => !sending && onClose()} title={`Message ${host}`}
      footer={<>
        <button className="font-semibold underline" onClick={onClose}>Cancel</button>
        <button onClick={send} disabled={sending} className="rounded-lg bg-ink px-6 py-3 font-semibold text-surface disabled:opacity-50">{sending ? "Sending…" : "Send message"}</button>
      </>}>
      <div className="flex items-center gap-4">
        <Avatar user={listing.host} className="h-12 w-12 text-lg" />
        <div className="min-w-0">
          <p className="font-semibold">{listing.host.name.split(" ")[0]}</p>
          <p className="truncate text-sm text-muted">{listing.title}</p>
        </div>
      </div>
      <label className="mt-6 block text-sm font-semibold" htmlFor="contact-host">Still have questions? Message the host</label>
      <textarea id="contact-host" value={body} onChange={(e) => { setBody(e.target.value); setError(null); }} rows={5} maxLength={2000}
        placeholder={`Hi ${host}! I'm thinking of staying at your place…`}
        className={`mt-2 w-full rounded-xl border-2 bg-transparent px-4 py-3 text-base outline-none ${error ? "border-rausch" : "border-ink/70 focus:border-ink"}`} />
      {error && <p className="mt-2 text-sm text-rausch">{error}</p>}
      <p className="mt-3 text-xs text-muted">To protect your payment, never transfer money or communicate outside of the Airbnb website or app.</p>
    </Modal>
  );
}
