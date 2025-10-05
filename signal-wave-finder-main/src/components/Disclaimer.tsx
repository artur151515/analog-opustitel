import { AlertCircle } from "lucide-react";

const Disclaimer = () => {
  return (
    <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-4 flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
      <div className="text-sm text-muted-foreground space-y-1">
        <p className="font-medium text-foreground">Важное предупреждение (18+)</p>
        <p>
          Данные сигналы не являются финансовой рекомендацией. Торговля бинарными опционами несёт
          высокие риски. Доступ к платформе может быть ограничен в зависимости от вашей юрисдикции.
        </p>
      </div>
    </div>
  );
};

export default Disclaimer;
