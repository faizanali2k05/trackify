import { useLocalSearchParams } from 'expo-router';
import { BudgetForm } from '@/features/budgets/BudgetForm';

export default function EditBudget() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <BudgetForm budgetId={id} />;
}
