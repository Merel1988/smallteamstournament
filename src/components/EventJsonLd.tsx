import { EVENT } from "@/lib/event";
import { SITE_URL } from "@/lib/seo";

/**
 * schema.org SportsEvent structured data for the tournament — rendered as a
 * JSON-LD script so Google can surface rich results (date, venue, organiser).
 * `description` is passed in so it follows the active locale.
 */
export default function EventJsonLd({ description }: { description: string }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: `${EVENT.name} — ${EVENT.league}`,
    description,
    startDate: EVENT.date.toISOString(),
    endDate: EVENT.endDate.toISOString(),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    url: SITE_URL,
    sport: "Roller derby",
    location: {
      "@type": "Place",
      name: EVENT.venue,
      address: {
        "@type": "PostalAddress",
        streetAddress: EVENT.street,
        postalCode: EVENT.postalCode,
        addressLocality: EVENT.city,
        addressCountry: EVENT.country,
      },
    },
    organizer: {
      "@type": "SportsOrganization",
      name: EVENT.league,
      url: SITE_URL,
    },
  };

  return (
    <script
      type="application/ld+json"
      // JSON.stringify output is safe to inline; no user input flows in here.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
