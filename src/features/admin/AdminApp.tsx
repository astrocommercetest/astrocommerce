import {
  createRouter,
  createRoute,
  createRootRoute,
  RouterProvider,
  createHashHistory,
  Link,
  Outlet,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Package, LayoutDashboard, ExternalLink, ShoppingBag } from "lucide-react";
import Toaster from "@/features/toasts/Toaster";
import { Separator } from "@/components/ui/separator";
import ProductList from "./ProductList";
import ProductForm from "./ProductForm";
import OrderList from "./OrderList";
import OrderDetail from "./OrderDetail";

const queryClient = new QueryClient();
const hashHistory = createHashHistory();

const activeClass = "bg-accent text-accent-foreground font-medium";
const linkClass =
  "flex items-center gap-2.5 text-sm px-3 py-2 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors";

const rootRoute = createRootRoute({
  component: () => (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 border-r border-border bg-card flex flex-col shrink-0">
        {/* Brand */}
        <div className="px-4 py-4 border-b border-border">
          <span className="font-semibold text-sm tracking-tight">AstroCommerce</span>
          <span className="ml-2 text-[10px] bg-primary text-primary-foreground rounded px-1.5 py-0.5 font-medium uppercase tracking-wide">
            Admin
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 flex flex-col gap-1">
          <Link to="/" className={linkClass} activeProps={{ className: `${linkClass} ${activeClass}` }}>
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>

          <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-medium px-3 mt-3 mb-1">
            Catalogo
          </p>
          <Link to="/products" className={linkClass} activeProps={{ className: `${linkClass} ${activeClass}` }}>
            <Package className="h-4 w-4" />
            Prodotti
          </Link>

          <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-medium px-3 mt-3 mb-1">
            Vendite
          </p>
          <Link to="/orders" className={linkClass} activeProps={{ className: `${linkClass} ${activeClass}` }}>
            <ShoppingBag className="h-4 w-4" />
            Ordini
          </Link>
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-border">
          <a
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-md hover:bg-accent"
          >
            <ExternalLink className="h-4 w-4" />
            Vai al negozio
          </a>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  ),
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight mb-1">Dashboard</h1>
      <p className="text-sm text-muted-foreground">Benvenuto nell&apos;area admin.</p>
    </div>
  ),
});

const productsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/products",
  component: ProductList,
});

const newProductRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/products/new",
  component: () => <ProductForm />,
});

const editProductRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/products/$id",
  component: () => <ProductForm />,
});

const ordersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/orders",
  component: OrderList,
});

const orderDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/orders/$id",
  component: OrderDetail,
});

const routeTree = rootRoute.addChildren([
  dashboardRoute,
  productsRoute,
  newProductRoute,
  editProductRoute,
  ordersRoute,
  orderDetailRoute,
]);

const router = createRouter({ routeTree, history: hashHistory });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function AdminApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster />
    </QueryClientProvider>
  );
}
