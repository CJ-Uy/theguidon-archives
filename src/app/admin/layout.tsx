import Link from "next/link";
import { Archive, Upload } from "lucide-react";

export const metadata = { title: "Admin | The GUIDON Archives" };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-tw className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4 sm:px-6 lg:px-8">
          <Link href="/admin" className="text-sm font-semibold tracking-tight">
            GUIDON Admin
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Archive className="h-4 w-4" />
              Issues
            </Link>
            <Link
              href="/admin/upload"
              className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Upload className="h-4 w-4" />
              Upload
            </Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
