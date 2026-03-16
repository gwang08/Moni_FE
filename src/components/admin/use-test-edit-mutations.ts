import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { deleteQuestionGroup, deleteQuestion } from '@/lib/admin-api';
import { toast } from 'sonner';

export function useTestEditMutations(testId: string) {
  const queryClient = useQueryClient();
  const [pendingDelete, setPendingDelete] = useState<{ type: 'group' | 'question'; id: number } | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'test', testId] });

  const requestDeleteGroup = useCallback((groupId: number) => {
    setPendingDelete({ type: 'group', id: groupId });
  }, []);

  const requestDeleteQuestion = useCallback((questionId: number) => {
    setPendingDelete({ type: 'question', id: questionId });
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!pendingDelete) return;
    try {
      if (pendingDelete.type === 'group') {
        await deleteQuestionGroup(pendingDelete.id);
        toast.success('Đã xóa nhóm câu hỏi');
      } else {
        await deleteQuestion(pendingDelete.id);
        toast.success('Đã xóa câu hỏi');
      }
      invalidate();
    } catch {
      toast.error('Xóa thất bại');
    } finally {
      setPendingDelete(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingDelete]);

  const cancelDelete = useCallback(() => setPendingDelete(null), []);

  return {
    handleDeleteGroup: requestDeleteGroup,
    handleDeleteQuestion: requestDeleteQuestion,
    pendingDelete,
    confirmDelete,
    cancelDelete,
  };
}
