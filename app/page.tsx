import Link from "next/link";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h2 className="mb-4 text-2xl font-bold text-coffee-800">
        Find your perfect coffee
      </h2>
      <p className="mb-8 text-coffee-600">
        Answer a few quick questions about your taste and brewing setup.
        We&apos;ll recommend 3 coffees that match you.
      </p>
      <Link
        href="/recommend"
        className="inline-block rounded-lg bg-coffee-600 px-6 py-3 font-medium text-white transition hover:bg-coffee-700"
      >
        Start recommendation flow
      </Link>
    </div>
  );
}
