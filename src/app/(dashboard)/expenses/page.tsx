import { getTransactions } from "@/actions/transaction";
import { AddExpenseDialog } from "./AddExpenseDialog";
import { ExpenseList } from "./ExpenseList";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
    const allTransactions = await getTransactions(50);
    const expenses = allTransactions.filter(tx => tx.type === "EXPENSE");
    
    // Get unique expense categories from transactions
    const categoryNames = [...new Set(expenses.map(e => e.expenseCategory).filter((c): c is string => c !== null))];

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Expenses</h1>
                    <p className="text-slate-500 dark:text-slate-400">Track and manage your daily expenses.</p>
                </div>
                <AddExpenseDialog categories={categoryNames.length > 0 ? categoryNames : ["LIFESTYLE", "FOOD"]} />
            </div>

            <div className="mt-8">
                <ExpenseList 
                    expenses={expenses.map(e => ({
                        id: e.id,
                        description: e.description,
                        amount: e.amount,
                        date: e.date,
                        expenseCategory: e.expenseCategory
                    }))} 
                    categories={categoryNames.length > 0 ? categoryNames : ["LIFESTYLE", "FOOD"]}
                />
            </div>
        </div>
    );
}
