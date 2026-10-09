"use client";
import Carousel from "@/components/Carousel";
import { Inspiration } from "@/components/Extras";
import OfferCard from "@/components/OfferCard";
import { ServiceCategoryTiles } from "@/components/Services";
import { NEARBY_AREA } from "@/lib/offers";
import { SERVICE_ROWS } from "@/lib/services";

/** Airbnb's Services tab: category tiles, then one carousel per category. */
export default function ServicesPage() {
  return (
    <div className="md:pt-10">
      <ServiceCategoryTiles title={`Services in ${NEARBY_AREA}`} />
      {SERVICE_ROWS.map(({ category, services }) => (
        <div key={category.key} id={category.key} className="scroll-mt-24">
          <Carousel title={category.label} href={`/services#${category.key}`} itemCount={services.length}>
            {services.map((s) => <OfferCard key={s.id} offer={s} kind="services" />)}
          </Carousel>
        </div>
      ))}
      <Inspiration />
    </div>
  );
}
