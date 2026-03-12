import { useQueryClient } from '@tanstack/react-query';
import { deleteQuestionGroup, deleteQuestion } from '@/lib/admin-api';
import { toast } from 'sonner';

export function useTestEditMutations(testId: string) {
  const queryClient = useQueryClient();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'test', testId] });

  const handleDeleteGroup = async (groupId: number) => {
    if (!confirm('Xóa nhóm câu hỏi này? Tất cả câu hỏi trong nhóm sẽ bị xóa.')) return;
    try {
      await deleteQuestionGroup(groupId);
      toast.success('Đã xóa nhóm câu hỏi');
      invalidate();
    } catch {
      toast.error('Xóa nhóm thất bại');
    }
  };

  const handleDeleteQuestion = async (questionId: number) => {
    if (!confirm('Xóa câu hỏi này?')) return;
    try {
      await deleteQuestion(questionId);
      toast.success('Đã xóa câu hỏi');
      invalidate();
    } catch {
      toast.error('Xóa câu hỏi thất bại');
    }
  };

  return { handleDeleteGroup, handleDeleteQuestion };
}
