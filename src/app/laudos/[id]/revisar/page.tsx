import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { laudos } from "@/db/schema";
import { ReviewForm } from "./review-form";

export default async function RevisarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [laudo] = await db.select().from(laudos).where(eq(laudos.id, id));
  if (!laudo) notFound();

  // Só dá pra revisar o que já foi extraído e ainda não publicado.
  if (laudo.status !== "revisar" || !laudo.extracao) {
    redirect(`/laudos/${id}`);
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
      <ReviewForm id={id} inicial={laudo.extracao} />
    </main>
  );
}
