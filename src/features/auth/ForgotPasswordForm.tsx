import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    await authClient.requestPasswordReset(
      { email, redirectTo: "/reset-password" },
      {
        onSuccess: () => setSuccess(true),
        onError: (ctx) => {
          setError(ctx.error.message ?? "Errore nell'invio dell'email.");
        },
      },
    );
    setLoading(false);
  }

  if (success) {
    return (
      <p className="text-sm">
        Controlla la tua email: ti abbiamo inviato un link per reimpostare la
        password.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
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
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={loading} className="button">
        {loading ? "Invio in corso..." : "Invia link di recupero"}
      </button>
      <p className="text-sm text-center">
        <a href="/login" className="underline">
          Torna al login
        </a>
      </p>
    </form>
  );
}
