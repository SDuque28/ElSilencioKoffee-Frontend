import { ChangeDetectionStrategy, Component, inject, type OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { CartStateService } from '../services/cart-state.service';

@Component({
  selector: 'app-cart-route-entry',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartRouteEntryComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly cartState = inject(CartStateService);

  ngOnInit(): void {
    this.cartState.openDrawer();

    const previousUrl = this.router.lastSuccessfulNavigation()?.finalUrl?.toString();
    const fallbackUrl = previousUrl && previousUrl !== '/cart' ? previousUrl : '/';

    void this.router.navigateByUrl(fallbackUrl, { replaceUrl: true });
  }
}
