import { ThemeToggle } from "@/components/layout/ThemeToggle";

export function Nav() {
  return (
    <nav className="fixed top-0 right-0 z-50 p-4 md:p-6">
      <ThemeToggle />
    </nav>
  );
}
