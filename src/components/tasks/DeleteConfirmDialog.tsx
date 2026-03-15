import { Dialog, DialogContent } from '../ui/dialog';
import { Button } from '../ui/button';

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  taskTitle,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  taskTitle: string;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          确定要删除「{taskTitle}」吗？此操作无法撤销。
        </p>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            className="bg-red-600 hover:bg-red-700"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            删除
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
