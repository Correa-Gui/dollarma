import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Loader2, Upload, X } from "lucide-react";
import { useStoreSettings, useUpdateStoreSettings } from "@/hooks/useStoreSettings";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatCpfCnpjPartial, trimText } from "@/lib/format";

const GeneralSettings = () => {
  const { data: settings, isLoading } = useStoreSettings();
  const updateSettings = useUpdateStoreSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    store_name: "",
    cnpj: "",
    address: "",
    timezone: "America/Sao_Paulo",
    currency: "BRL",
    logo_url: "" as string | null,
  });

  useEffect(() => {
    if (settings) {
      setForm({
        store_name: settings.store_name || "",
        cnpj: settings.cnpj || "",
        address: settings.address || "",
        timezone: settings.timezone || "America/Sao_Paulo",
        currency: settings.currency || "BRL",
        logo_url: settings.logo_url || null,
      });
    }
  }, [settings]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Imagem deve ter no máximo 2MB");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `logo.${ext}`;

      // Remove old logo if exists
      await supabase.storage.from("store-assets").remove([path]);

      const { error: uploadErr } = await supabase.storage
        .from("store-assets")
        .upload(path, file, { upsert: true });

      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage
        .from("store-assets")
        .getPublicUrl(path);

      const logoUrl = urlData.publicUrl + "?t=" + Date.now();
      setForm((f) => ({ ...f, logo_url: logoUrl }));
      toast.success("Logo carregada");
    } catch (err: any) {
      toast.error(`Erro ao enviar logo: ${err.message}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeLogo = () => {
    setForm((f) => ({ ...f, logo_url: null }));
  };

  const save = () => {
    updateSettings.mutate({
      ...form,
      store_name: trimText(form.store_name),
      cnpj: formatCpfCnpjPartial(form.cnpj),
      address: trimText(form.address),
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações Gerais</h1>
        <p className="text-muted-foreground text-sm">Dados básicos da loja</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados da Loja</CardTitle>
          <CardDescription>Informações que aparecem em relatórios e recibos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nome da Loja</Label>
            <Input value={form.store_name} onChange={(e) => setForm({ ...form, store_name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>CNPJ</Label>
              <Input value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: formatCpfCnpjPartial(e.target.value) })} placeholder="00.000.000/0000-00" />
            </div>
            <div className="space-y-2">
              <Label>Moeda</Label>
              <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BRL">Real (R$)</SelectItem>
                  <SelectItem value="USD">Dólar (US$)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Endereço</Label>
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Fuso Horário</Label>
            <Select value={form.timezone} onValueChange={(v) => setForm({ ...form, timezone: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="America/Sao_Paulo">Brasília (GMT-3)</SelectItem>
                <SelectItem value="America/Manaus">Manaus (GMT-4)</SelectItem>
                <SelectItem value="America/Noronha">Fernando de Noronha (GMT-2)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Logo Upload */}
          <div className="space-y-2">
            <Label>Logo da Loja</Label>
            <div className="flex items-center gap-4">
              {form.logo_url ? (
                <div className="relative">
                  <img
                    src={form.logo_url}
                    alt="Logo da loja"
                    className="h-20 w-20 rounded-lg border object-contain bg-muted"
                  />
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="absolute -top-2 -right-2 rounded-full bg-destructive text-destructive-foreground h-5 w-5 flex items-center justify-center"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="h-20 w-20 rounded-lg border border-dashed flex items-center justify-center text-muted-foreground bg-muted/50">
                  <Upload className="h-6 w-6" />
                </div>
              )}
              <div className="flex flex-col gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
                  {form.logo_url ? "Trocar logo" : "Enviar logo"}
                </Button>
                <span className="text-xs text-muted-foreground">PNG, JPG até 2MB</span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
            </div>
          </div>

          <Button onClick={save} disabled={updateSettings.isPending}>
            {updateSettings.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            Salvar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default GeneralSettings;
