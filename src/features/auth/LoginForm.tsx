import { useState } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { authClient } from "@/lib/auth-client";

export default function LoginForm({
  redirectTo = "/",
}: {
  redirectTo?: string;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await authClient.signIn.email(
      { email, password },
      {
        onError: (ctx) => {
          if (ctx.error.status === 403) {
            setError("Verifica il tuo indirizzo email prima di accedere.");
          } else {
            setError(ctx.error.message ?? "Errore durante l'accesso.");
          }
        },
      },
    );
    setLoading(false);
    if (!error) {
      window.location.href = redirectTo;
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4  w-full">
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
        <a href="/forgot-password" className="text-xs text-gray-500 underline mt-1 self-end">
          Password dimenticata?
        </a>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={loading} className="button">
        {loading ? "Accesso in corso..." : "Accedi"}
      </button>
      <p className="text-sm text-center">
        Non hai un account?{" "}
        <a href="/register" className="underline">
          Registrati
        </a>
      </p>
    </form>
  );
}
