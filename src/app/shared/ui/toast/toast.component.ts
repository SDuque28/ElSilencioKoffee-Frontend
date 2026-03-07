import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgClass } from '@angular/common';

import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast',
  imports: [NgClass],
  templateUrl: './toast.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastComponent {
  readonly toastService = inject(ToastService);

  getClasses(variant: 'default' | 'success' | 'error'): string {
    switch (variant) {
      case 'success':
        return 'border-accent/40 bg-emerald-50 text-emerald-900';
      case 'error':
        return 'border-danger/40 bg-rose-50 text-rose-900';
      default:
        return 'border-border bg-white text-foreground';
    }
  }
}
