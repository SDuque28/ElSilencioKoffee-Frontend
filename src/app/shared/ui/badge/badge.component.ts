import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../utils/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
  {
    variants: {
      variant: {
        neutral: 'bg-stone-200 text-stone-800',
        success: 'bg-emerald-100 text-emerald-800',
        warning: 'bg-amber-100 text-amber-900',
        danger: 'bg-rose-100 text-rose-800',
      },
    },
    defaultVariants: {
      variant: 'neutral',
    },
  },
);

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>;

@Component({
  selector: 'app-badge',
  imports: [NgClass],
  templateUrl: './badge.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeComponent {
  @Input() variant: BadgeVariant = 'neutral';
  @Input() className = '';

  get classes(): string {
    return cn(badgeVariants({ variant: this.variant }), this.className);
  }
}
