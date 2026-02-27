import { Construction } from "lucide-react";

interface ComingSoonProps {
  title?: string;
}

const ComingSoon = ({ title = "Em Breve" }: ComingSoonProps) => (
  <div className="flex flex-col items-center justify-center py-20 gap-4">
    <Construction className="h-16 w-16 text-muted-foreground/50" />
    <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
    <p className="text-muted-foreground text-center max-w-md">
      Este módulo está em desenvolvimento e estará disponível em breve.
    </p>
  </div>
);

export default ComingSoon;
