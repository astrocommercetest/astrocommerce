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

export default function RegisterForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const strength = password ? strengthConfig[passwordStrength(password).id] : null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Le password non coincidono.");
      return;
    }
    setError(null);
    setLoading(true);
    await authClient.signUp.email(
      { name: `${firstName} ${lastName}`.trim(), email, password },
      {
        onSuccess: () => setSuccess(true),
        onError: (ctx) => {
          setError(ctx.error.message ?? "Errore durante la registrazione.");
        },
      }
    );
    setLoading(false);
  }

  if (success) {
    return (
      <div className="max-w-sm">
        <p className="text-sm">
          Registrazione avvenuta. Controlla la tua email e clicca il link di
          verifica per attivare l&apos;account.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-sm">
      <div className="flex gap-3">
        <div className="flex flex-col gap-1 flex-1">
          <label htmlFor="firstName" className="text-sm font-medium">
            Nome
          </label>
          <input
            id="firstName"
            type="text"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
        </div>
        <div className="flex flex-col gap-1 flex-1">
          <label htmlFor="lastName" className="text-sm font-medium">
            Cognome
          </label>
          <input
            id="lastName"
            type="text"
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
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
                    i <= strengthConfig.indexOf(strength) ? strength.color : "bg-gray-200"
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
            className="w-full border border-gray-300 rounded px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
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

      <label className="flex items-start gap-2 text-sm cursor-pointer">
        <input type="checkbox" required className="mt-0.5 shrink-0" />
        <span>
          Ho letto e accetto la{" "}
          <a href="/privacy-policy" target="_blank" className="underline">
            Privacy Policy
          </a>{" "}
          e le{" "}
          <a href="/condizioni-di-utilizzo" target="_blank" className="underline">
            Condizioni di utilizzo
          </a>
        </span>
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={loading} className="button">
        {loading ? "Registrazione in corso..." : "Registrati"}
      </button>
      <p className="text-sm text-center">
        Hai già un account?{" "}
        <a href="/login" className="underline">
          Accedi
        </a>
      </p>
    </form>
  );
}
