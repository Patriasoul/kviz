import { useEffect, useState } from "react";
import { ArrowLeft, LogIn, UserPlus } from "lucide-react";
import { supabase } from "../supabase";

export default function Auth({ onBack, onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supabase || !onAuthenticated) return undefined;

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        onAuthenticated();
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [onAuthenticated]);

  const finishAuthentication = () => {
    if (onAuthenticated) onAuthenticated();
    else onBack?.();
  };

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    if (!supabase) {
      setError("Prijava trenutačno nije konfigurirana.");
      setBusy(false);
      return;
    }

    if (mode === "register") {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName.trim() || undefined } },
      });

      if (signUpError) {
        setError(signUpError.message);
      } else if (!data.session) {
        setMessage("Registracija je uspješna. Provjeri e-mail i potvrdi račun prije prijave.");
      } else {
        setMessage("Račun je kreiran i prijavljeni ste.");
        finishAuthentication();
      }
    } else {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(signInError.message);
      } else {
        setMessage("Prijava uspješna.");
        if (data.session) finishAuthentication();
      }
    }

    setBusy(false);
  };

  return (
    <main className="mx-auto max-w-md px-4 py-14 sm:px-6 sm:py-20">
      <div className="patria-card p-7 sm:p-9">
        <button onClick={onBack} className="mb-7 inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" /> Natrag
        </button>
        <p className="text-sm font-bold uppercase tracking-[.16em] text-accent">PatriaSoul</p>
        <h1 className="mt-2 font-display text-3xl font-bold">{mode === "login" ? "Prijava" : "Registracija"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Prijavi se za spremanje rezultata i ulazak na rang-listu.</p>

        <form onSubmit={submit} className="mt-7 space-y-4">
          {mode === "register" && (
            <label className="block text-sm font-semibold">
              Ime za rang-listu
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 font-normal outline-none focus:ring-2 focus:ring-red-200" placeholder="npr. Ivan Horvat" maxLength={80} />
            </label>
          )}
          <label className="block text-sm font-semibold">
            E-mail
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 font-normal outline-none focus:ring-2 focus:ring-red-200" autoComplete="email" />
          </label>
          <label className="block text-sm font-semibold">
            Lozinka
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 font-normal outline-none focus:ring-2 focus:ring-red-200" autoComplete={mode === "login" ? "current-password" : "new-password"} />
          </label>

          {error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
          {message && <p className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">{message}</p>}

          <button disabled={busy} className="patria-button-accent w-full justify-center disabled:cursor-not-allowed disabled:opacity-60">
            {mode === "login" ? <LogIn className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
            {busy ? "Molimo pričekaj…" : mode === "login" ? "Prijavi se" : "Registriraj se"}
          </button>
        </form>

        <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); setMessage(""); }} className="mt-6 w-full text-sm font-semibold text-accent underline underline-offset-4">
          {mode === "login" ? "Nemam račun — registracija" : "Već imam račun — prijava"}
        </button>
      </div>
    </main>
  );
}
