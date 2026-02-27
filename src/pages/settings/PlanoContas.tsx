import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Construction } from "lucide-react";

const PlanoContas = () => (
  <div className="space-y-6 max-w-2xl">
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Plano de Contas</h1>
      <p className="text-muted-foreground text-sm">Categorização contábil de receitas e despesas</p>
    </div>
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Em desenvolvimento</CardTitle>
        <CardDescription>O plano de contas será integrado ao módulo financeiro completo</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center py-8 gap-3">
        <Construction className="h-12 w-12 text-muted-foreground/50" />
        <p className="text-muted-foreground text-sm">Disponível em breve</p>
      </CardContent>
    </Card>
  </div>
);

export default PlanoContas;
