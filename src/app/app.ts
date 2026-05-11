import { DOCUMENT } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { Router, RouterOutlet, NavigationStart } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { CartDrawerComponent } from './features/cart/components/cart-drawer.component';
import { ProductModalComponent } from './features/products/components/product-modal.component';
import { CartStateService } from './features/cart/services/cart-state.service';
import { ProductModalService } from './features/products/services/product-modal.service';
import { ToastComponent } from './shared/ui/toast/toast.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ProductModalComponent, CartDrawerComponent, ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly cartState = inject(CartStateService);
  private readonly productModal = inject(ProductModalService);

  protected readonly title = signal('El Silencio Koffee');

  constructor() {
    this.normalizeShellStyles();
    queueMicrotask(() => this.normalizeShellStyles());
    setTimeout(() => this.normalizeShellStyles(), 0);

    this.router.events
      .pipe(
        filter((event): event is NavigationStart => event instanceof NavigationStart),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.cartState.closeDrawer();
        this.productModal.close();
        this.normalizeShellStyles();
        queueMicrotask(() => this.normalizeShellStyles());
      });
  }

  private normalizeShellStyles(): void {
    const targets = [
      this.document.documentElement,
      this.document.body,
      this.document.querySelector('app-root'),
      this.document.querySelector('app-main-layout'),
    ].filter((element): element is HTMLElement => element instanceof HTMLElement);

    for (const element of targets) {
      element.style.opacity = '1';
      element.style.filter = 'none';
      element.style.backdropFilter = 'none';
      element.style.mixBlendMode = 'normal';
    }
  }
}
