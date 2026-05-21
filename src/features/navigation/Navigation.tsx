import MegaMenu from "./MegaMenu";
import MobileMenu from "./MobileMenu";
import CartBadge from "../cart/CartBadge";
import type { TopLevelItem } from "./types";
import { authClient } from "@/lib/auth-client";
import Avatar from "@/features/auth/Avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
  items: TopLevelItem[];
  siteTitle: string;
}

function UserMenu() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) return null;

  if (session?.user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400">
            <Avatar name={session.user.name} size="sm" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium truncate">{session.user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <a href="/ordini">I miei ordini</a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-600 focus:text-red-600"
            onClick={() =>
              authClient.signOut({ fetchOptions: { onSuccess: () => { window.location.href = "/"; } } })
            }
          >
            Esci
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <a href="/login" className="text-sm underline">
      Accedi
    </a>
  );
}

export default function Navigation({ items, siteTitle }: Props) {
  return (
    <header className="relative flex items-center gap-16 bg-gray-100 px-4 py-3 z-40">
      <a
        href="/"
        className="text-lg font-bold shrink-0 flex items-center gap-2"
      >
        <img src="/logo.svg" alt="Logo" className="w-6 h-6" />
        <span> {siteTitle}</span>
      </a>
      <MegaMenu items={items} />
      <div className="ml-auto flex items-center gap-4">
        <UserMenu />
        <CartBadge />
        <MobileMenu items={items} />
      </div>
    </header>
  );
}
