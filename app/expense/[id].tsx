import { useLocalSearchParams } from 'expo-router';
import { ExpenseForm } from '@/features/expenses/ExpenseForm';

export default function EditExpense() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ExpenseForm expenseId={id} />;
}
