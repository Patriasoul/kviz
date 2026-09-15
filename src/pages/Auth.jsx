import { useEffect, useState } from "react";
import { ArrowLeft, KeyRound, LogIn, UserPlus, ShieldCheck } from "lucide-react";
import { supabase } from "../supabase";

const logoImage = `${import.meta.env.BASE_URL}images/logo Patriasoul.png`;

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
      if (session?.user && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) onAuthenticated();
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

    if (mode === "forgot") {
      const redirectTo = `${window.location.origin}${import.meta.env.BASE_URL}`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (resetError) setError(resetError.message);
      else setMessage("Ako račun s tim e-mailom postoji, poslali smo poveznicu za postavljanje nove lozinke.");
      setBusy(false);
      return;
    }

    if (mode === "register") {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName.trim() || undefined } },
      });
      if (signUpError) setError(signUpError.message);
      else if (!data.session) setMessage("Registracija je uspješna. Provjeri e-mail i potvrdi račun prije prijave.");
      else { setMessage("Račun je kreiran i prijavljeni ste."); finishAuthentication(); }
    } else {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) setError(signInError.message);
      else { setMessage("Prijava uspješna."); if (data.session) finishAuthentication(); }
    }
    setBusy(false);
  };

  const isForgot = mode === "forgot";

  return (
    <main className="mx-auto max-w-lg px-4 py-10 sm:px-6 sm:py-16">
      <div className="patria-card overflow-hidden shadow-xl">
        <div className="patria-checker bg-primary px-7 py-8 text-primary-foreground sm:px-9 sm:py-10">
          <img src={logoImage} alt="PatriaSoul" className="mx-auto h-16 w-auto object-contain" />
          <div className="mx-auto mt-5 flex max-w-sm items-center justify-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-red-200">
            <ShieldCheck className="h-4 w-4" /> Natjecanje · rang-lista · napredovanje
          </div>
          <h1 className="mt-3 text-center font-display text-3xl font-bold sm:text-4xl">{isForgot ? "Vrati pristup svom računu" : "Sudjeluj u PatriaSoul natjecanju"}</h1>
          <p className="mx-auto mt-3 max-w-md text-center text-sm leading-relaxed text-primary-foreground/80 sm:text-base">
            {isForgot ? "Unesi e-mail i dobit ćeš sigurnu poveznicu za postavljanje nove lozinke." : "Za igranje kvizova i sudjelovanje u natjecanju potrebno je imati svoj PatriaSoul račun. Prijavom možeš pratiti rezultat, osvajati XP, razine i bedževe te se natjecati na rang-listi."}
          </p>
        </div>

        <div className="p-7 sm:p-9">
          <button onClick={onBack} className="mb-6 inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="mr-2 h-4 w-4" /> Natrag</button>
          <p className="text-sm font-bold uppercase tracking-[.16em] text-accent">{isForgot ? "Lozinka" : mode === "login" ? "Dobro došao natrag" : "Pridruži se"}</p>
          <h2 className="mt-2 font-display text-2xl font-bold">{isForgot ? "Zaboravljena lozinka" : mode === "login" ? "Prijava" : "Registracija"}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{isForgot ? "Poslat ćemo ti e-mail s poveznicom za sigurnu promjenu lozinke." : mode === "login" ? "Prijavi se i nastavi svoje natjecanje." : "Kreiraj račun i kreni u svoje PatriaSoul natjecanje."}</p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            {mode === "register" && <label className="block text-sm font-semibold">Ime za rang-listu<input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 font-normal outline-none focus:ring-2 focus:ring-red-200" placeholder="npr. Ivan Horvat" maxLength={80} /></label>}
            <label className="block text-sm font-semibold">E-mail<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 font-normal outline-none focus:ring-2 focus:ring-red-200" autoComplete="email" /></label>
            {!isForgot && <label className="block text-sm font-semibold">Lozinka<input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 font-normal outline-none focus:ring-2 focus:ring-red-200" autoComplete={mode === "login" ? "current-password" : "new-password"} /></label>}
            {error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
            {message && <p className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">{message}</p>}
            <button disabled={busy} className="patria-button-accent w-full justify-center disabled:cursor-not-allowed disabled:opacity-60"><KeyRound className="mr-2 h-4 w-4" />{busy ? "Molimo pričekaj…" : isForgot ? "Pošalji poveznicu za novu lozinku" : mode === "login" ? "Prijavi se i igraj" : "Registriraj se i igraj"}</button>
          </form>

          <div className="mt-6 flex flex-col gap-3 text-center text-sm font-semibold">
            {mode === "login" && <button onClick={() => { setMode("forgot"); setError(""); setMessage(""); }} className="text-accent underline underline-offset-4">Zaboravili ste lozinku?</button>}
            {isForgot && <button onClick={() => { setMode("login"); setError(""); setMessage(""); }} className="text-accent underline underline-offset-4">Natrag na prijavu</button>}
            {!isForgot && <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); setMessage(""); }} className="text-accent underline underline-offset-4">{mode === "login" ? "Nemam račun — registracija" : "Već imam račun — prijava"}</button>}
          </div>
        </div>
      </div>
    </main>
  );
}
