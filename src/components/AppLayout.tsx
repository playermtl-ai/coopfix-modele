import { useState, type ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  ClipboardList,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Plus,
  Settings,
  User,
  Users,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "@/components/Logo";
import { HowItWorks } from "@/components/HowItWorks";
import { RoleBadge } from "@/components/badges";
import { useAuth } from "@/lib/auth";
import { useCoopName } from "@/lib/queries";
import { cn } from "@/lib/utils";

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  const { profile, signOut } = useAuth();
  const { data: coopName } = useCoopName();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAdmin = profile?.role === "admin";

  const navItems = [
    { to: "/tableau-de-bord", label: "Tableau de bord", icon: LayoutDashboard },
    { to: "/billets", label: isAdmin ? "Billets" : "Mes billets", icon: ClipboardList },
    ...(isAdmin
      ? [
          { to: "/admin/adresses", label: "Adresses", icon: MapPin },
          { to: "/admin/membres", label: "Membres", icon: Users },
          { to: "/admin/parametres", label: "Paramètres", icon: Settings },
        ]
      : []),
    { to: "/profil", label: "Mon profil", icon: User },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex items-center gap-2.5 rounded-full px-4 py-2 text-sm font-bold transition-colors",
      isActive
        ? "bg-primary text-primary-foreground shadow-sm"
        : "text-foreground/70 hover:bg-muted hover:text-foreground"
    );

  const mobileNav = (
    <nav className="flex flex-col gap-1.5">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={navLinkClass}
          onClick={() => setMobileOpen(false)}
        >
          <item.icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-card/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4 md:px-6">
          <Link to="/tableau-de-bord" className="flex min-w-0 items-center gap-2.5">
            <Logo size={38} />
            <div className="min-w-0">
              <p className="truncate font-display text-base font-bold leading-tight md:text-lg">
                {coopName ?? "Nom de votre coop à inscrire"}
              </p>
              <p className="hidden text-[11px] font-semibold uppercase tracking-wide text-primary/80 sm:block">
                Billets de réparation
              </p>
            </div>
          </Link>

          <nav className="ml-6 hidden flex-1 items-center gap-1 lg:flex">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={navLinkClass}>
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Button
              asChild
              className="hidden rounded-full font-bold sm:inline-flex"
              size="sm"
            >
              <Link to="/billets/nouveau">
                <Plus className="h-4 w-4" />
                Nouveau billet
              </Link>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-display text-sm font-bold text-primary-foreground transition-transform hover:scale-105"
                  aria-label="Mon compte"
                >
                  {initials(profile?.full_name ?? "")}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 rounded-2xl">
                <DropdownMenuLabel>
                  <p className="font-display text-sm font-bold">{profile?.full_name}</p>
                  <p className="truncate text-xs font-normal text-muted-foreground">
                    {profile?.email}
                  </p>
                  <div className="mt-1.5">
                    {profile && <RoleBadge role={profile.role} />}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="rounded-xl font-semibold">
                  <Link to="/profil">
                    <User className="h-4 w-4" />
                    Mon profil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="rounded-xl font-semibold text-destructive focus:text-destructive"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4" />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full lg:hidden"
                  aria-label="Ouvrir le menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 rounded-r-3xl p-5">
                <SheetTitle className="sr-only">Menu de navigation</SheetTitle>
                <div className="mb-5 flex items-center gap-2.5">
                  <Logo size={34} />
                  <div>
                    <p className="font-display text-sm font-bold leading-tight">
                      {coopName ?? "Nom de votre coop à inscrire"}
                    </p>
                    <p className="flex items-center gap-1 text-[11px] font-semibold text-primary">
                      <Wrench className="h-3 w-3" />
                      Billets de réparation
                    </p>
                  </div>
                </div>
                {mobileNav}
                <Button asChild className="mt-5 w-full rounded-full font-bold">
                  <Link to="/billets/nouveau" onClick={() => setMobileOpen(false)}>
                    <Plus className="h-4 w-4" />
                    Nouveau billet
                  </Link>
                </Button>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-8 md:px-6">{children}</main>

      <footer className="border-t border-border/70 bg-card/50 py-5">
        <div className="mb-3 flex justify-center"><HowItWorks /></div>
        <p className="mx-auto max-w-6xl px-4 text-center text-xs font-semibold text-muted-foreground md:px-6">
          CoopFix · Gabarit de billets de réparation pour coopératives d'habitation
        </p>
      </footer>
    </div>
  );
}
