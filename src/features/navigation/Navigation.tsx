import MegaMenu from "./MegaMenu";
import MobileMenu from "./MobileMenu";
import CartBadge from "../cart/CartBadge";
import type { TopLevelItem } from "./types";
import { authClient } from "@/lib/auth-client";
import Avatar from "@/features/auth/Avatar";

interface Props {
  items: TopLevelItem[];
  siteTitle: string;
}

function UserMenu() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) return null;

  if (session?.user) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <Avatar name={session.user.name} size="sm" />
        <button
          onClick={() =>
            authClient.signOut({ fetchOptions: { onSuccess: () => { window.location.href = "/"; } } })
          }
          className="underline"
        >
          Esci
        </button>
      </div>
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
