import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Loader2 } from "lucide-react";
import { useStoreSettings, useUpdateStoreSettings } from "@/hooks/useStoreSettings";

const GeneralSettings = () => {
  const { data: settings, isLoading } = useStoreSettings();
  const updateSettings = useUpdateStoreSettings();

  const [form, setForm] = useState({
    store_name: "",
    cnpj: "",
    address: "",
    timezone: "America/Sao_Paulo",
    currency: "BRL",
  });

  useEffect(() => {
    if (settings) {
      setForm({
        store_name: settings.store_name || "",
        cnpj: settings.cnpj || "",
        address: settings.address || "",
        timezone: settings.timezone || "America/Sao_Paulo",
        currency: settings.currency || "BRL",
      });
    }
  }, [settings]);

  const save = () => {
    updateSettings.mutate(form);
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
              <Input value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} />
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
