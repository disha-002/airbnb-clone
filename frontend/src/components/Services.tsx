"use client";
import Link from "next/link";
import { SERVICE_CATEGORIES, SERVICE_ROWS } from "@/lib/services";

/* eslint-disable @next/next/no-img-element */

/** Fixed-size grey tiles with Airbnb's isometric icons. They don't stretch to fill the row. */
export function ServiceCategoryTiles({ title }: { title: string }) {
  return (
    <section className="mb-8 md:mb-12">
      <h2 className="px-5 text-[22px] font-heavy leading-7 tracking-tight md:px-10 min-[1440px]:px-12 md:text-xl md:leading-6 md:tracking-[-0.18px]">{title}</h2>
      <div className="no-scrollbar mt-4 flex gap-2.5 overflow-x-auto px-5 md:px-10 min-[1440px]:px-12">
        {SERVICE_CATEGORIES.map((c) => (
          <Link key={c.key} href={SERVICE_ROWS.some((r) => r.category.key === c.key) ? `/services#${c.key}` : "/services"} className="group w-[34vw] max-w-[179px] shrink-0 md:w-[179px]">
            <div className="flex aspect-square items-center justify-center rounded-card bg-soft">
              <img src={c.icon} alt="" className="w-[73%] transition-transform duration-300 ease-out group-hover:scale-105" />
            </div>
            <p className="mt-2 px-0.5 text-[13px] font-medium">{c.label}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
