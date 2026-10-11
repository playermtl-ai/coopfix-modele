import { UnitSelect } from "@/components/UnitSelect";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  BadgeAlert,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LogIn,
  Mail,
  MapPin,
  Phone,
  User,
  UserPlus,
  Users,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Logo } from "@/components/Logo";
import { HowItWorks } from "@/components/HowItWorks";
import { Illustration } from "@/components/Illustration";
import { PageLoader } from "@/components/PageLoader";
import { useAuth } from "@/lib/auth";
import { useAddresses, useCoopName } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";

function frAuthError(message: string) {
  if (message.includes("Invalid login credentials")) return "Courriel ou mot de passe incorrect.";
  if (message.includes("already registered"))
    return "Un compte existe déjà avec ce courriel. Connectez-vous plutôt.";
  if (message.includes("at least 6"))
    return "Le mot de passe doit contenir au moins 6 caractères.";
  if (message.includes("Password")) return "Mot de passe trop faible.";
  if (message.toLowerCase().includes("rate limit")) return "La limite de tentatives ou d’envoi de courriels est atteinte. Attendez avant de réessayer; des demandes répétées ne débloquent pas cette limite.";
  return "Une erreur est survenue. Réessayez.";
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      {message}
    </div>
  );
}

function PasswordInput({
  value,
  onChange,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  id: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        id={id}
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 rounded-xl pl-11 pr-11 text-base"
        placeholder="••••••••"
        required
        minLength={6}
        autoComplete="current-password"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export default function Login() {
  const { session, loading, recoveryPending } = useAuth();
  const navigate = useNavigate();
  const { data: coopName } = useCoopName();
  const { data: addresses = [] } = useAddresses();

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [addressId, setAddressId] = useState("");
  const [unit, setUnit] = useState("");
  const [signupError, setSignupError] = useState("");
  const [signingUp, setSigningUp] = useState(false);
  const [signupMessage, setSignupMessage] = useState("");

  useEffect(() => {
    if (session && !loading) navigate(recoveryPending ? "/nouveau-mot-de-passe" : "/tableau-de-bord", { replace: true });
  }, [session, loading, recoveryPending, navigate]);

  if (session) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <PageLoader label="Connexion en cours…" />
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoggingIn(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail.trim(),
      password: loginPassword,
    });
    setLoggingIn(false);
    if (error) setLoginError(frAuthError(error.message));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError("");
    setSignupMessage("");
    if (password.length < 6) {
      setSignupError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    const selectedAddress = addresses.find(a => a.id === addressId);
    if (addresses.length && (!selectedAddress || (selectedAddress.allowed_units.length > 0 && !selectedAddress.allowed_units.includes(unit)))) {
      setSignupError("Choisissez votre adresse et un logement autorisé par la coopérative.");
      return;
    }
    setSigningUp(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
        data: {
          full_name: fullName.trim(),
          phone: phone.trim() || null,
          address_id: addressId || null,
          unit: unit.trim() || null,
        },
      },
    });
    setSigningUp(false);
    if (error) {
      setSignupError(frAuthError(error.message));
      return;
    }
    if (!data.session) {
      setSignupError("");
      setSignupMessage("Consultez votre boîte courriel pour confirmer votre inscription, puis connectez-vous.");
    }
    // Avec session : la redirection est gérée par le effet ci-dessus.
  };

  const features = [
    {
      icon: Wrench,
      title: "Billets de réparation simples",
      text: "Les membres signalent un bris en moins d'une minute.",
    },
    {
      icon: Users,
      title: "Suivi par la coordination",
      text: "Les administrateurs reçoivent, priorisent et complètent les demandes.",
    },
    {
      icon: BadgeAlert,
      title: "Priorités claires",
      text: "Urgent, prioritaire ou normal : rien ne passe entre les mailles.",
    },
  ];

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* Panneau vitrine */}
      <div className="wine-pattern relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex xl:p-14">
        <div className="flex items-center gap-3">
          <Logo size={46} />
          <div>
            <p className="font-display text-2xl font-bold leading-tight">CoopFix</p>
            <p className="text-sm font-semibold text-primary-foreground/80">
              {coopName ?? "Nom de votre coop à inscrire"}
            </p>
          </div>
        </div>

        <div className="max-w-md">
          <h1 className="font-display text-4xl font-bold leading-tight xl:text-[2.75rem]">
            Les réparations de votre coop, sans papier ni courriel égaré.
          </h1>
          <ul className="mt-8 space-y-5">
            {features.map((f) => (
              <li key={f.title} className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FBE8A6] text-[#9B1B30]">
                  <f.icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-display text-lg font-bold leading-snug">{f.title}</p>
                  <p className="text-sm text-primary-foreground/75">{f.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <Illustration className="h-52 w-auto max-w-[420px] self-end opacity-95" />
      </div>

      {/* Panneau formulaires */}
      <div className="flex flex-col items-center justify-center bg-background px-4 py-10 md:px-8">
        <div className="mb-6 flex flex-col items-center gap-2 lg:hidden">
          <Logo size={52} />
          <p className="font-display text-xl font-bold">CoopFix</p>
          <p className="text-sm font-semibold text-muted-foreground">
            {coopName ?? "Nom de votre coop à inscrire"}
          </p>
        </div>

        <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8">
          <Tabs defaultValue="connexion">
            <TabsList className="grid h-auto w-full grid-cols-2 rounded-full bg-muted p-1">
              <TabsTrigger
                value="connexion"
                className="rounded-full py-2.5 font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Connexion
              </TabsTrigger>
              <TabsTrigger
                value="inscription"
                className="rounded-full py-2.5 font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Devenir membre
              </TabsTrigger>
            </TabsList>

            <TabsContent value="connexion" className="mt-6 space-y-4">
              <div>
                <h2 className="font-display text-2xl font-bold">Bon retour !</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Connectez-vous pour suivre vos billets de réparation.
                </p>
              </div>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="login-email" className="font-bold">
                    Courriel
                  </Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="login-email"
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="h-12 rounded-xl pl-11 text-base"
                      placeholder="marie@exemple.ca"
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="login-password" className="font-bold">
                    Mot de passe
                  </Label>
                  <PasswordInput
                    id="login-password"
                    value={loginPassword}
                    onChange={setLoginPassword}
                  />
                </div>
                <div className="text-right">
                  <Link to="/mot-de-passe-oublie" className="text-sm font-semibold text-primary underline underline-offset-4">Mot de passe oublié ?</Link>
                </div>
                {loginError && <ErrorBox message={loginError} />}
                <Button
                  type="submit"
                  disabled={loggingIn}
                  className="h-12 w-full rounded-full text-base font-bold"
                >
                  {loggingIn ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <LogIn className="h-5 w-5" />
                  )}
                  Se connecter
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="inscription" className="mt-6 space-y-4">
              <div>
                <h2 className="font-display text-2xl font-bold">Créer mon compte membre</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Sélectionnez votre adresse pour que la coordination sache où intervenir.
                </p>
              </div>
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-name" className="font-bold">
                      Nom complet
                    </Label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="signup-name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="h-12 rounded-xl pl-11 text-base"
                        placeholder="Marie Tremblay"
                        required
                        autoComplete="name"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-phone" className="font-bold">
                      Téléphone <span className="font-normal text-muted-foreground">(facultatif)</span>
                    </Label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="signup-phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="h-12 rounded-xl pl-11 text-base"
                        placeholder="418 555-1234"
                        autoComplete="tel"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-email" className="font-bold">
                    Courriel
                  </Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 rounded-xl pl-11 text-base"
                      placeholder="marie@exemple.ca"
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-password" className="font-bold">
                    Mot de passe
                  </Label>
                  <PasswordInput
                    id="signup-password"
                    value={password}
                    onChange={setPassword}
                  />
                </div>
                {addresses.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1.6fr_1fr]">
                    <div className="space-y-1.5">
                      <Label className="font-bold">Mon adresse</Label>
                      <Select value={addressId} onValueChange={value => { setAddressId(value); setUnit(""); }}>
                        <SelectTrigger className="h-12 w-full rounded-xl text-base">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <SelectValue placeholder="Choisir mon adresse" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {addresses.map((a) => (
                            <SelectItem key={a.id} value={a.id} className="rounded-lg">
                              {a.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="signup-unit" className="font-bold">
                        Logement
                      </Label>
                      <UnitSelect id="signup-unit" address={addresses.find(a => a.id === addressId)} value={unit} onChange={setUnit} />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 rounded-2xl border border-[#F1D98B] bg-[#FBE8A6]/60 px-4 py-3 text-sm font-semibold text-[#7A5A0F]">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    Aucune adresse pour l'instant. Un administrateur pourra l'ajouter à votre profil
                    une fois les adresses de la coop configurées.
                  </div>
                )}
                {signupError && <ErrorBox message={signupError} />}
                <Button
                  type="submit"
                  disabled={signingUp}
                  className="h-12 w-full rounded-full text-base font-bold"
                >
                  {signingUp ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <UserPlus className="h-5 w-5" />
                  )}
                  Créer mon compte
                </Button>
              </form>
              <p className="rounded-2xl bg-muted px-4 py-3 text-xs font-semibold text-muted-foreground">
                Le premier compte créé devient administrateur de la coop.
                Les comptes suivants sont des membres.
              </p>
            </TabsContent>
          </Tabs>
          {signupMessage && <p role="status" className="mt-4 rounded-2xl bg-muted px-4 py-3 text-sm font-semibold">{signupMessage}</p>}
        </div>

        <div className="mt-5"><HowItWorks /></div>
        <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
          <a className="underline" href="/confidentialite.html">Confidentialité</a>
          <a className="underline" href="/suppression-compte.html">Suppression de compte</a>
        </div>

        <p className="mt-6 text-center text-xs font-semibold text-muted-foreground">
          CoopFix · Conçu pour les coopératives d'habitation
        </p>
      </div>
    </div>
  );
}
