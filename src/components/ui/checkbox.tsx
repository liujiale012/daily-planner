import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, ...props }, ref) => (
    <label className="relative inline-flex cursor-pointer items-center">
      <input
        type="checkbox"
        ref={ref}
        className="peer sr-only"
        checked={checked}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        {...props}
      />
      <div
        className={cn(
          'flex h-4 w-4 items-center justify-center rounded border border-gray-300 text-white peer-checked:border-indigo-600 peer-checked:bg-indigo-600',
          checked && 'border-indigo-600 bg-indigo-600',
          className
        )}
      >
        {checked && <Check className="h-3 w-3" strokeWidth={3} />}
      </div>
    </label>
  )
);
Checkbox.displayName = 'Checkbox';
export { Checkbox };
