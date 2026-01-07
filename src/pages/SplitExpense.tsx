import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { SplitExpenseDialog } from "@/components/SplitExpenseDialog";
import { Plus } from "lucide-react";

export function SplitExpensePage() {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("split_expense") || "Split Expense"}</h1>
          <p className="text-muted-foreground mt-1">
            {t("split_expense_page_description") ||
              "Divide expenses and generate Revolut payment links for each person"}
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t("create_split_expense") || "Create Split Expense"}
        </Button>
      </div>

      <div className="rounded-lg border p-6 bg-muted/50">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">
            {t("how_it_works") || "How it works"}
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>{t("split_expense_step_1") || "Enter the expense description and total amount"}</li>
            <li>{t("split_expense_step_2") || "Specify how many people to split between"}</li>
            <li>
              {t("split_expense_step_3") ||
                "Get individual Revolut payment links for each person"}
            </li>
            <li>
              {t("split_expense_step_4") ||
                "Share the links - each person can pay their share directly"}
            </li>
          </ol>
        </div>
      </div>

      <SplitExpenseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialData={null}
      />
    </div>
  );
}

