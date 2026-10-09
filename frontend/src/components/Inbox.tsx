"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { fmtShort } from "@/lib/dates";
import { clockTime, dayLabel, refreshUnread, shortTime } from "@/lib/messaging";
import type { ChatMessage, Conversation, ConversationDetail } from "@/lib/types";
import { useToast } from "@/context/ToastContext";
import { useUser } from "@/context/UserContext";
import { ChevronLeft } from "./ListingIcons";
import Avatar from "./Avatar";

/* eslint-disable @next/next/no-img-element */

function ConversationRow({ c, active, meId, href }: { c: Conversation; active: boolean; meId: number; href: string }) {
  const last = c.last_message;
  return (
    <Link href={href} scroll={false} aria-current={active ? "true" : undefined}
      className={`flex gap-3 border-b border-hairline px-5 py-4 hover:bg-soft ${active ? "bg-soft" : ""}`}>
      <Avatar user={c.other} className="h-12 w-12 text-lg" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className={`truncate text-[15px] ${c.unread ? "font-semibold" : "font-medium"}`}>{c.other.name}</p>
          {last && <span className={`shrink-0 text-xs ${c.unread ? "font-semibold" : "text-muted"}`}>{shortTime(last.created_at)}</span>}
        </div>
        <p className="truncate text-xs text-muted">{c.listing.title} · {c.listing.city}</p>
        <div className="mt-0.5 flex items-center gap-2">
          <p className={`min-w-0 flex-1 truncate text-sm ${c.unread ? "font-semibold" : "text-muted"}`}>
            {last ? `${last.sender_id === meId ? "You: " : ""}${last.body}` : ""}
          </p>
          {c.unread > 0 && <span aria-label={`${c.unread} unread`} className="h-2.5 w-2.5 shrink-0 rounded-full bg-rausch" />}
        </div>
      </div>
    </Link>
  );
}

function Thread({ id, meId, hadUnread, onBack, onChanged }: { id: number; meId: number; hadUnread: boolean; onBack: () => void; onChanged: () => void }) {
  const toast = useToast();
  const [convo, setConvo] = useState<ConversationDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const stick = useRef(true); // keep the view pinned to the newest message unless the reader scrolled up
  const unreadBefore = useRef(hadUnread);
  const seen = useRef<number | null>(null); // message count at the last fetch

  const load = useCallback(() => {
    api<ConversationDetail>(`/conversations/${id}`)
      .then((c) => {
        // Fetching a thread marks it read on the server. Refresh the badges only when that changed something:
        // it had unread messages when opened, or a new message from the other person just arrived.
        const last = c.messages[c.messages.length - 1];
        const newFromThem = seen.current !== null && c.messages.length > seen.current && last?.sender_id !== meId;
        if (unreadBefore.current || newFromThem) { unreadBefore.current = false; refreshUnread(); }
        seen.current = c.messages.length;
        setConvo(c); setError(null);
      })
      .catch((e) => setError(e.message));
  }, [id, meId]);

  useEffect(() => { setConvo(null); setDraft(""); stick.current = true; seen.current = null; load(); }, [load]);
  useEffect(() => { const t = setInterval(load, 4000); return () => clearInterval(t); }, [load]);

  const count = convo?.messages.length ?? 0;
  useLayoutEffect(() => {
    const el = scroller.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [count, convo?.id]);

  // Takes the text from the textarea itself: on a fast Enter, `draft` state can lag a keystroke behind.
  const send = async (text = draft) => {
    const body = text.trim();
    if (!body || sending || !convo) return;
    setSending(true);
    stick.current = true;
    const temp: ChatMessage = { id: -Date.now(), sender_id: meId, body, created_at: new Date().toISOString() };
    setConvo({ ...convo, messages: [...convo.messages, temp] }); // optimistic: show it immediately
    setDraft("");
    try {
      await api(`/conversations/${id}/messages`, { method: "POST", body: JSON.stringify({ body }) });
      load();
      onChanged();
    } catch (e) {
      setConvo({ ...convo, messages: convo.messages });
      setDraft(body);
      toast((e as Error).message);
    }
    setSending(false);
  };

  if (error) return <p className="p-10 text-center text-muted">{error}</p>;
  if (!convo) return <div className="flex-1 animate-pulse bg-soft/50" />;

  let lastDay = "";
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-3 border-b border-hairline px-4 py-3 md:px-6">
        <button onClick={onBack} aria-label="Back to messages" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-soft lg:hidden">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <Avatar user={convo.other} className="h-11 w-11 text-lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{convo.other.name}</p>
          <Link href={`/listings/${convo.listing.id}`} className="block truncate text-sm text-muted underline">{convo.listing.title}</Link>
        </div>
        {convo.stay && (
          <span className={`hidden shrink-0 rounded-full px-3 py-1 text-xs font-semibold sm:block ${convo.stay.status === "cancelled" ? "bg-soft text-muted line-through" : "bg-soft"}`}>
            {fmtShort(convo.stay.check_in)} – {fmtShort(convo.stay.check_out)}
          </span>
        )}
      </div>

      <div ref={scroller} onScroll={(e) => { const el = e.currentTarget; stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80; }}
        className="flex-1 space-y-1 overflow-y-auto px-4 py-5 md:px-6" aria-live="polite">
        {convo.messages.map((m) => {
          const day = dayLabel(m.created_at);
          const showDay = day !== lastDay;
          lastDay = day;
          const mine = m.sender_id === meId;
          return (
            <div key={m.id}>
              {showDay && <p className="my-4 text-center text-xs font-medium text-muted">{day}</p>}
              <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-[15px] leading-[21px] ${mine ? "rounded-br-md bg-ink text-surface" : "rounded-bl-md bg-soft"}`}>
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <p className={`mt-1 text-[11px] ${mine ? "text-surface/60" : "text-muted"}`}>{clockTime(m.created_at)}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex items-end gap-3 border-t border-hairline px-4 py-3 md:px-6">
        <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={1} maxLength={2000} placeholder="Write a message"
          aria-label="Write a message"
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(e.currentTarget.value); } }}
          onInput={(e) => { const t = e.currentTarget; t.style.height = "auto"; t.style.height = `${Math.min(t.scrollHeight, 120)}px`; }}
          className="max-h-[120px] min-h-[44px] flex-1 resize-none rounded-3xl border border-[#b0b0b0] bg-transparent px-5 py-[11px] text-[15px] outline-none focus:border-ink" />
        <button disabled={!draft.trim() || sending}
          className="h-11 shrink-0 rounded-full bg-gradient-to-r from-[#E61E4D] via-[#E31C5F] to-[#D70466] px-6 text-sm font-semibold text-white disabled:opacity-40">
          Send
        </button>
      </form>
    </div>
  );
}

/** Guest and host inbox: conversation list on the left, the open chat on the right (one column on phones). */
export default function Inbox() {
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [convos, setConvos] = useState<Conversation[] | null>(null);
  const selected = Number(sp.get("c")) || null;

  const loadList = useCallback(() => {
    api<Conversation[]>("/conversations").then(setConvos).catch(() => setConvos((c) => c ?? []));
  }, []);
  useEffect(() => { loadList(); const t = setInterval(loadList, 8000); return () => clearInterval(t); }, [loadList]);

  // /messages?listing=12 opens your conversation about that listing (e.g. "Message your host" on a trip).
  const forListing = Number(sp.get("listing")) || null;
  useEffect(() => {
    if (!forListing || selected || !convos) return;
    const match = convos.find((c) => c.listing.id === forListing);
    if (match) router.replace(`${pathname}?c=${match.id}`, { scroll: false });
  }, [forListing, selected, convos, pathname, router]);

  if (!user) return null;
  const href = (id: number) => `${pathname}?c=${id}`;
  // list-only on phones until a thread is opened; both side by side on laptops
  const showThread = !!selected;

  return (
    <div className="mx-auto max-w-[1120px] px-0 pb-10 pt-0 md:px-10 md:pt-6">
      <h1 className={`px-5 pb-4 pt-4 text-[26px] font-semibold md:px-0 md:pt-0 md:text-[28px] ${showThread ? "hidden lg:block" : ""}`}>Messages</h1>
      <div className="flex h-[calc(100dvh-180px)] min-h-[480px] overflow-hidden border-hairline bg-surface md:rounded-2xl md:border lg:h-[calc(100vh-190px)]">
        <aside className={`w-full shrink-0 flex-col overflow-y-auto border-hairline lg:flex lg:w-[360px] lg:border-r ${showThread ? "hidden" : "flex"}`}>
          {convos === null && [0, 1, 2].map((i) => <div key={i} className="m-4 h-16 animate-pulse rounded-xl bg-soft" />)}
          {convos?.length === 0 && (
            <div className="px-6 py-16 text-center">
              <p className="font-semibold">No messages yet</p>
              <p className="mt-1 text-sm text-muted">
                {user.role === "host" ? "When a guest books or messages you, the conversation shows up here." : "Message a host from any listing, or book a stay, and your conversation shows up here."}
              </p>
              <Link href={user.role === "host" ? "/host/listings" : "/"} className="mt-6 inline-block rounded-lg border border-ink px-5 py-2.5 text-sm font-semibold">
                {user.role === "host" ? "View your listings" : "Start exploring"}
              </Link>
            </div>
          )}
          {convos?.map((c) => <ConversationRow key={c.id} c={c} active={c.id === selected} meId={user.id} href={href(c.id)} />)}
        </aside>

        <section className={`min-w-0 flex-1 flex-col ${showThread ? "flex" : "hidden lg:flex"}`}>
          {selected ? (
            <Thread key={selected} id={selected} meId={user.id} hadUnread={!!convos?.find((c) => c.id === selected)?.unread} onBack={() => router.replace(pathname, { scroll: false })} onChanged={loadList} />
          ) : (
            <div className="m-auto max-w-xs px-6 text-center">
              <p className="font-semibold">Select a message</p>
              <p className="mt-1 text-sm text-muted">Choose a conversation on the left to read it and reply.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
