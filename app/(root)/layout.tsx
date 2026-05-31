import Link from "next/link";
import { ReactNode } from "react";
import { redirect } from "next/navigation";

import { isAuthenticated } from "@/lib/actions/auth.action";

const Layout = async ({ children }: { children: ReactNode }) => {
  const isUserAuthenticated = await isAuthenticated();
  if (!isUserAuthenticated) redirect("/sign-in");

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="navbar">
        <Link href="/" className="flex items-center gap-3 group">
          {/* Logo Mark */}
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 shadow-[0_0_16px_rgba(47,106,255,0.4)] group-hover:shadow-[0_0_24px_rgba(47,106,255,0.6)] transition-all duration-300">
            <span className="font-mono font-bold text-white text-sm">&lt;/&gt;</span>
          </div>
          {/* Wordmark */}
          <div className="flex flex-col leading-none">
            <span className="nav-logo-text">CrackCode AI</span>
            <span className="text-[10px] text-muted-foreground tracking-widest uppercase">
              Intelligence Platform
            </span>
          </div>
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
          >
            Dashboard
          </Link>
          <Link
            href="/interview/setup"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
          >
            Interviews
          </Link>
          <Link
            href="/analytics"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
          >
            Analytics
          </Link>
        </div>

        {/* CTA */}
        <Link href="/interview/setup" className="btn-primary text-sm py-2 px-5">
          + New Interview
        </Link>
      </nav>

      {/* Page Content */}
      <main className="root-layout">{children}</main>
    </div>
  );
};

export default Layout;
