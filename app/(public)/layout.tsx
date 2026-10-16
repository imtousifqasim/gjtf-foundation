import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { LiveEditorProvider } from "@/components/editor/LiveEditorProvider";
import { getPageContentsDb } from "@/lib/db/mysql";
import { getAuthenticatedDonor } from "@/lib/auth/donor";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let initialEdits: Record<string, { text?: string; url?: string }> = {};
  let isDonorLoggedIn = false;

  try {
    const [edits, donor] = await Promise.all([
      getPageContentsDb().catch(() => ({})),
      getAuthenticatedDonor().catch(() => null),
    ]);
    initialEdits = edits || {};
    isDonorLoggedIn = Boolean(donor);
  } catch (err) {
    console.warn("[PublicLayout] Non-blocking initial content fetch notice:", err);
  }

  return (
    <LiveEditorProvider initialEdits={initialEdits}>
      <Header donorLoggedIn={isDonorLoggedIn} />
      <main className="flex-1">{children}</main>
      <Footer />
    </LiveEditorProvider>
  );
}
