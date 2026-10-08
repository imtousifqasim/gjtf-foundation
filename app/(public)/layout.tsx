import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { LiveEditorProvider } from "@/components/editor/LiveEditorProvider";
import { getPageContentsDb } from "@/lib/db/mysql";

export const dynamic = "force-dynamic";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let initialEdits: Record<string, { text?: string; url?: string }> = {};
  try {
    initialEdits = await getPageContentsDb();
  } catch (err) {
    console.warn("[PublicLayout] Non-blocking initial content fetch:", err);
  }

  return (
    <LiveEditorProvider initialEdits={initialEdits}>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </LiveEditorProvider>
  );
}

