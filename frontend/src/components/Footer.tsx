const COLS: Record<string, string[]> = {
  Support: ["Help Centre", "Get help with a safety issue", "AirCover", "Anti-discrimination", "Disability support", "Cancellation options", "Report neighbourhood concern"],
  Hosting: ["Airbnb your home", "Airbnb your experience", "Airbnb your service", "AirCover for Hosts", "Hosting resources", "Community forum", "Hosting responsibly", "Join a free hosting class", "Find a co-host", "Refer a host"],
  Airbnb: ["2026 Summer Release", "Newsroom", "Careers", "Investors", "Airbnb.org emergency stays"],
};

const Facebook = () => (
  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor" aria-label="Facebook"><path d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9V12h3.4l-.5 3.5h-2.9v8.4A12 12 0 0 0 24 12Z" /></svg>
);
const XIcon = () => (
  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor" aria-label="X"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117Z" /></svg>
);
const Instagram = () => (
  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" aria-label="Instagram"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>
);
const Globe = () => (
  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9.5" /><path d="M2.5 12h19M12 2.5c3 3 3 16.500 0 19M12 2.500c-3 3-3 16.500 0 19" /></svg>
);

export default function Footer() {
  return (
    <footer className="bg-soft px-5 pb-10 md:px-10 md:pb-12">
      <div className="mx-auto max-w-[1760px]">
        <div className="md:grid md:grid-cols-3 md:gap-10 md:pt-12">
          {Object.entries(COLS).map(([title, links], i) => (
            <div key={title} className={`pb-6 pt-6 md:py-0 ${i < 2 ? "border-b border-hairline md:border-0" : ""}`}>
              <h4 className="mb-4 font-semibold md:text-sm">{title}</h4>
              <ul className="space-y-5 text-[17px] md:space-y-4 md:text-sm">
                {links.map((l) => <li key={l}><span className="cursor-pointer hover:underline">{l}</span></li>)}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-hairline pt-6 md:mt-12 md:flex md:items-center md:justify-between md:pt-8">
          {/* phone: language row + socials first, then copyright */}
          <div className="order-2 flex items-center gap-6 font-semibold md:text-sm">
            <span className="flex items-center gap-2"><Globe /> English (IN)</span>
            <span>₹ INR</span>
            <span className="ml-1 hidden items-center gap-5 md:flex"><Facebook /><XIcon /><Instagram /></span>
          </div>
          <div className="mt-5 flex items-center gap-6 md:hidden"><Facebook /><XIcon /><Instagram /></div>
          <p className="mt-5 text-[15px] md:order-1 md:mt-0 md:text-sm">
            © 2026 Airbnb, Inc. <span className="mx-1">·</span> Privacy <span className="mx-1">·</span> Terms <span className="mx-1">·</span> Company details
          </p>
        </div>
      </div>
    </footer>
  );
}
