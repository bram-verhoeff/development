import { Sidebar } from "@/components/Sidebar";

// Schil voor alle pagina's achter de login: navigatie + werkvlak
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar />
      <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
    </div>
  );
}
