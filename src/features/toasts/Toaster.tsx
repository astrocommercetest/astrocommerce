import { useEffect, useRef } from "react";
import { useStore } from "@nanostores/react";
import { Toaster as SonnerToaster, toast as sonnerToast } from "sonner";
import { toasts, removeToast } from "./toastStore";

export default function Toaster() {
  const items = useStore(toasts);
  const dispatched = useRef(new Set<string>());

  useEffect(() => {
    for (const t of items) {
      if (dispatched.current.has(t.id)) continue;
      dispatched.current.add(t.id);
      sonnerToast[t.type](t.message);
      removeToast(t.id);
    }
  }, [items]);

  return <SonnerToaster richColors position="bottom-right" />;
}
