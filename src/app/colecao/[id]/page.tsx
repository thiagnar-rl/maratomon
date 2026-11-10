import type { Metadata } from "next";
import { CollectionDetail } from "@/components/collection/collection-detail";

export const metadata: Metadata = { title: "Deck ou pasta", robots: { index: false } };

type Props = { params: Promise<{ id: string }> };

export default async function CollectionDetailPage({ params }: Props) {
  const { id } = await params;
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6">
      <CollectionDetail id={id} />
    </div>
  );
}
