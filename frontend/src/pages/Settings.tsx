import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Mail, MailCheck, MailX, User, Save } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/api/auth";
import { gmailApi } from "@/api/gmail";

export default function Settings() {
  const { user, refreshUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [name, setName] = useState(user?.name || "");
  const [gmailAddress, setGmailAddress] = useState(user?.gmail_address || "");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const gmailParam = searchParams.get("gmail");
    const refreshToken = searchParams.get("refresh_token");
    if (gmailParam === "connected" && refreshToken) {
      gmailApi.connect(refreshToken).then(() => {
        refreshUser();
        setSearchParams({});
      });
    }
  }, [searchParams]);

  const updateMutation = useMutation({
    mutationFn: () => authApi.updateMe({ name, gmail_address: gmailAddress }),
    onSuccess: () => {
      refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const connectGmailMutation = useMutation({
    mutationFn: async () => {
      const { data } = await gmailApi.getAuthUrl();
      window.location.href = data.auth_url;
    },
  });

  const disconnectGmailMutation = useMutation({
    mutationFn: () => gmailApi.disconnect(),
    onSuccess: () => refreshUser(),
  });

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    updateMutation.mutate();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie seu perfil e integrações
        </p>
      </div>

      {/* Profile Section */}
      <div className="card">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Perfil</h2>
            <p className="text-xs text-muted-foreground">
              Informações da sua conta
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label htmlFor="name" className="label mb-1.5 block">
              Nome
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input max-w-md"
            />
          </div>

          <div>
            <label className="label mb-1.5 block">E-mail</label>
            <input
              type="email"
              value={user?.email || ""}
              disabled
              className="input max-w-md cursor-not-allowed opacity-60"
            />
          </div>

          <div>
            <label htmlFor="gmail" className="label mb-1.5 block">
              E-mail para receber boletos
            </label>
            <input
              id="gmail"
              type="email"
              value={gmailAddress}
              onChange={(e) => setGmailAddress(e.target.value)}
              className="input max-w-md"
              placeholder="restaurante@gmail.com"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="btn btn-primary gap-2"
            >
              <Save className="h-4 w-4" />
              {updateMutation.isPending ? "Salvando..." : "Salvar alterações"}
            </button>
            {saved && (
              <span className="text-sm text-success">Salvo com sucesso!</span>
            )}
          </div>
        </form>
      </div>

      {/* Gmail Integration */}
      <div className="card">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Mail className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Integração Gmail
            </h2>
            <p className="text-xs text-muted-foreground">
              Conecte seu Gmail para importar boletos automaticamente
            </p>
          </div>
        </div>

        {user?.gmail_connected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg bg-success/10 px-4 py-3">
              <MailCheck className="h-5 w-5 text-success" />
              <div>
                <p className="text-sm font-medium text-success">
                  Gmail conectado
                </p>
                <p className="text-xs text-success/80">
                  Boletos serão importados automaticamente
                </p>
              </div>
            </div>
            <button
              onClick={() => disconnectGmailMutation.mutate()}
              disabled={disconnectGmailMutation.isPending}
              className="btn btn-destructive gap-2"
            >
              <MailX className="h-4 w-4" />
              Desconectar Gmail
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg bg-muted px-4 py-3">
              <MailX className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Gmail não conectado
                </p>
                <p className="text-xs text-muted-foreground">
                  Conecte para importar boletos dos seus e-mails
                </p>
              </div>
            </div>
            <button
              onClick={() => connectGmailMutation.mutate()}
              disabled={connectGmailMutation.isPending}
              className="btn btn-primary gap-2"
            >
              <Mail className="h-4 w-4" />
              Conectar Gmail
            </button>
          </div>
        )}
      </div>

      {/* About */}
      <div className="card">
        <h2 className="mb-2 text-base font-semibold text-foreground">Sobre</h2>
        <p className="text-sm text-muted-foreground">
          Note Manager v1.0.0 — Sistema de controle de notas e boletos para
          restaurantes.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Conta criada em{" "}
          {user?.created_at
            ? new Intl.DateTimeFormat("pt-BR").format(new Date(user.created_at))
            : "—"}
        </p>
      </div>
    </div>
  );
}
