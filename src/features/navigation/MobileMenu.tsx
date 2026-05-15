import React from "react";
import {
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import type { TopLevelItem } from "./types";

interface Props {
  items: TopLevelItem[];
}

export default function MobileMenu({ items }: Props) {
  const [open, setOpen] = React.useState(false);
  const [expanded, setExpanded] = React.useState<string | null>(null);

  const toggle = (label: string) =>
    setExpanded((prev) => (prev === label ? null : label));

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Apri menu"
        className="p-1 text-gray-700 cursor-pointer"
      >
        <Bars3Icon className="w-6 h-6" />
      </button>

      <div
        className={`fixed inset-0 z-50  duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      >
        {/* backdrop */}
        <div
          className="absolute inset-0 bg-black/40"
          onClick={() => setOpen(false)}
        />

        {/* drawer slides in from the right */}
        <div
          className={`absolute right-0 top-0 h-full w-80 max-w-full bg-white overflow-y-auto shadow-xl flex flex-col transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <span className="font-bold text-lg">Menu</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Chiudi menu"
              className="p-1 text-gray-700 cursor-pointer"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <nav className="flex-1 p-4">
            <ul className="flex flex-col divide-y divide-gray-100">
              {items.map((item) => (
                <li key={item.label}>
                  <button
                    type="button"
                    onClick={() => toggle(item.label)}
                    className="w-full flex items-center justify-between py-3 text-sm font-medium text-gray-900 cursor-pointer"
                  >
                    {item.label}
                    <ChevronDownIcon
                      className={[
                        "w-4 h-4 text-gray-400 transition-transform duration-200",
                        expanded === item.label ? "rotate-180" : "",
                      ].join(" ")}
                    />
                  </button>

                  {expanded === item.label && (
                    <div className="pb-3 flex flex-col gap-4">
                      {item.columns.flat().map((section) => (
                        <div key={section.label}>
                          <a
                            href={section.href}
                            onClick={() => setOpen(false)}
                            className="block text-sm font-semibold text-gray-800 hover:text-gray-600 mb-1"
                          >
                            {section.label}
                          </a>
                          {section.children && (
                            <ul className="flex flex-col gap-1 pl-3">
                              {section.children.map((child) => (
                                <li key={child.label}>
                                  <a
                                    href={child.href}
                                    onClick={() => setOpen(false)}
                                    className="block text-sm text-gray-500 hover:text-gray-900 py-0.5"
                                  >
                                    {child.label}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                      <a
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="text-xs text-gray-400 hover:text-gray-700 underline"
                      >
                        Vedi tutto {item.label}
                      </a>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
}
