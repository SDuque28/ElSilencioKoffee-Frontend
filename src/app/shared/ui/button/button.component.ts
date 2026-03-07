import {
  ChangeDetectionStrategy,
  Component,
  Input,
  Output,
  EventEmitter,
  type OnInit,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        secondary: 'bg-amber-100 text-amber-900 hover:bg-amber-200',
        outline: 'border border-border bg-white text-foreground hover:bg-amber-50',
        ghost: 'text-foreground hover:bg-amber-100/70',
        destructive: 'bg-danger text-white hover:bg-danger/90',
      },
      size: {
        sm: 'h-8 px-3',
        md: 'h-10 px-4',
        lg: 'h-11 px-6',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
);

type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>['variant']>;
type ButtonSize = NonNullable<VariantProps<typeof buttonVariants>['size']>;

@Component({
  selector: 'app-button',
  imports: [NgClass],
  templateUrl: './button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonComponent implements OnInit {
  @Input() variant: ButtonVariant = 'default';
  @Input() size: ButtonSize = 'md';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Input() className = '';
  @Output() buttonClick = new EventEmitter<MouseEvent>();

  buttonClasses = '';

  ngOnInit(): void {
    this.buttonClasses = cn(
      buttonVariants({ variant: this.variant, size: this.size }),
      this.className,
    );
  }

  onClick(event: MouseEvent): void {
    this.buttonClick.emit(event);
  }
}
