"use client";
import { Fragment } from "react";
import Carousel from "@/components/Carousel";
import { Inspiration } from "@/components/Extras";
import OfferCard from "@/components/OfferCard";
import { EXPERIENCE_ROWS, POPULAR_FROM } from "@/lib/experiences";

/** Airbnb's Experiences tab: nearby rows, Originals, then rows for popular cities. */
export default function ExperiencesPage() {
  return (
    <div className="md:pt-10">
      {EXPERIENCE_ROWS.map((row) => (
        <Fragment key={row.key}>
          {row.key === POPULAR_FROM && (
            <h2 className="mb-8 mt-4 px-5 text-[28px] font-semibold leading-tight tracking-tight md:px-10 min-[1440px]:px-12 md:text-[32px]">
              Popular with travellers from your area
            </h2>
          )}
          <Carousel title={row.title} subtitle={row.subtitle} href="/experiences" itemCount={row.items.length}>
            {row.items.map((o) => <OfferCard key={o.id} offer={o} kind="experiences" />)}
          </Carousel>
        </Fragment>
      ))}
      <Inspiration />
    </div>
  );
}
