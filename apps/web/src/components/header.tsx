import { Link } from "@tanstack/react-router";
import { CalendarCheck } from "lucide-react";
import { ModeToggle } from "./mode-toggle.tsx";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";

type NavItem = {
  name: string;
  path: string;
};

type HeaderProps = {
  navItems?: NavItem[];
};

export function Header({ navItems }: HeaderProps) {
  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between">
          <div className="container ml-6 flex h-16 items-center">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 pr-2">
                <CalendarCheck size={20} />
                <span className="font-bold text-xl tracking-tight">Timblo</span>
              </div>

              <nav className="flex items-center gap-2">
                {navItems?.map((item) => (
                  <Button key={item.path} variant="ghost" size="sm" asChild>
                    <Link
                      to={item.path}
                      activeProps={{
                        className: "bg-muted",
                      }}
                    >
                      {item.name}
                    </Link>
                  </Button>
                ))}
              </nav>
            </div>
          </div>
          <div className="mr-6">
            <ModeToggle />
          </div>
        </div>
        <Separator />
      </header>
    </>
  );
}
