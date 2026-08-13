/**
 * Renders a JSON-LD structured-data block. Server component — the serialized
 * schema.org object is emitted directly into the HTML so crawlers can read it
 * without executing JavaScript.
 *
 * Accepts one object or an array of objects (multiple schemas on one page).
 */
export function JsonLd({ data }: { data: object | object[] }) {
  const blocks = Array.isArray(data) ? data : [data];
  return (
    <>
      {blocks.map((block, index) => (
        <script
          key={index}
          type="application/ld+json"
          // Structured data is server-generated from trusted metadata; JSON.stringify
          // escapes it. Guard against '<' to avoid breaking out of the script tag.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(block).replace(/</g, '\\u003c'),
          }}
        />
      ))}
    </>
  );
}
