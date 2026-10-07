import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { LiveEditorProvider } from "@/components/editor/LiveEditorProvider";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LiveEditorProvider>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </LiveEditorProvider>
  );
}
