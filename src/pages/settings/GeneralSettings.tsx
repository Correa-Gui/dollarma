import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Save } from "lucide-react";

const GeneralSettings = () => {
  const [settings, setSettings] = useState({
    storeName: "Minha Loja",
    cnpj: "12.345.678/0001-90",
    address: "Rua Exemplo, 123 - Centro - São Paulo/SP",
    timezone: "America/Sao_Paulo",
    currency: "BRL",
  });

  const save = () => {
    toast.success("Configurações salvas");
  };

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
            <Input value={settings.storeName} onChange={(e) => setSettings({ ...settings, storeName: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>CNPJ</Label>
              <Input value={settings.cnpj} onChange={(e) => setSettings({ ...settings, cnpj: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Moeda</Label>
              <Select value={settings.currency} onValueChange={(v) => setSettings({ ...settings, currency: v })}>
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
            <Input value={settings.address} onChange={(e) => setSettings({ ...settings, address: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Fuso Horário</Label>
            <Select value={settings.timezone} onValueChange={(v) => setSettings({ ...settings, timezone: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="America/Sao_Paulo">Brasília (GMT-3)</SelectItem>
                <SelectItem value="America/Manaus">Manaus (GMT-4)</SelectItem>
                <SelectItem value="America/Noronha">Fernando de Noronha (GMT-2)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={save}>
            <Save className="h-4 w-4 mr-1" /> Salvar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default GeneralSettings;
