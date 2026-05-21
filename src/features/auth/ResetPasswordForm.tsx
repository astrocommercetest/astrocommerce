import { useState } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { passwordStrength } from "check-password-strength";
import { authClient } from "@/lib/auth-client";

const strengthConfig = [
  { label: "Debole", color: "bg-red-400" },
  { label: "Discreta", color: "bg-orange-400" },
  { label: "Buona", color: "bg-yellow-400" },
  { label: "Ottima", color: "bg-green-500" },
];

export default function ResetPasswordForm() {
  const token = new URLSearchParams(window.location.search).get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const strength = password ? strengthConfig[passwordStrength(password).id] : null;

  if (!token) {
    return (
      <p className="text-sm text-red-600">
        Link non valido. Richiedi un nuovo link di recupero.
      </p>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Le password non coincidono.");
      return;
    }
    setError(null);
    setLoading(true);
    await authClient.resetPassword(
      { newPassword: password, token },
      {
        onSuccess: () => {
          window.location.href = "/login";
        },
        onError: (ctx) => {
          setError(
            ctx.error.message ?? "Link scaduto o non valido. Riprova.",
          );
        },
      },
    );
    setLoading(false);
  }

  const inputClass =
    "w-full border border-gray-300 rounded px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium">
          Nuova password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label={showPassword ? "Nascondi password" : "Mostra password"}
          >
            {showPassword ? (
              <EyeSlashIcon className="w-5 h-5" />
            ) : (
              <EyeIcon className="w-5 h-5" />
            )}
          </button>
        </div>
        {strength && (
          <div className="mt-1 flex flex-col gap-1">
            <div className="flex gap-1">
              {strengthConfig.map((s, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    i <= strengthConfig.indexOf(strength)
                      ? strength.color
                      : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500">
              Sicurezza: {strength.label}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="confirmPassword" className="text-sm font-medium">
          Conferma password
        </label>
        <div className="relative">
          <input
            id="confirmPassword"
            type={showConfirm ? "text" : "password"}
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={inputClass}
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label={showConfirm ? "Nascondi password" : "Mostra password"}
          >
            {showConfirm ? (
              <EyeSlashIcon className="w-5 h-5" />
            ) : (
              <EyeIcon className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={loading} className="button">
        {loading ? "Salvataggio..." : "Reimposta password"}
      </button>
    </form>
  );
}
