import React from "react";
import type { TopLevelItem } from "./types";

interface Props {
  items: TopLevelItem[];
}

export default function MegaMenu({ items }: Props) {
  const [activeKey, setActiveKey] = React.useState<string | null>(null);
  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const open = (label: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setActiveKey(label);
  };

  const close = () => {
    closeTimer.current = setTimeout(() => setActiveKey(null), 120);
  };

  return (
    <nav className="hidden lg:flex items-center gap-6">
      {items.map((item) => {
        const dropdownItems = item.columns.flat();
        return (
          <div
            key={item.label}
            className="relative"
            onMouseEnter={() => open(item.label)}
            onMouseLeave={close}
          >
            <a
              href={item.href}
              className={[
                "text-sm font-medium transition-colors py-1",
                activeKey === item.label
                  ? "text-gray-900"
                  : "text-gray-600 hover:text-gray-900",
              ].join(" ")}
            >
              {item.label}
            </a>

            {activeKey === item.label && dropdownItems.length > 0 && (
              <ul className="absolute top-full left-0 mt-3 bg-white border border-gray-100 rounded-lg shadow-lg py-1 min-w-44 z-50">
                <span className="absolute -top-1.5 left-4 w-3 h-3 bg-white border-l border-t border-gray-100 rotate-45" />
                {dropdownItems.map((child) => (
                  <li key={child.label}>
                    <a
                      href={child.href}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                    >
                      {child.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </nav>
  );
}
