import { NgFor, NgIf } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
  type OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { isApiSuccessResponse } from '../../../core/models/api-response.model';
import type { Product } from '../../../core/models/product.model';
import { BadgeComponent } from '../../../shared/ui/badge/badge.component';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { CardComponent } from '../../../shared/ui/card/card.component';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { CartStateService } from '../../cart/services/cart-state.service';
import { ProductsService, type ProductsListResponse } from '../services/products.service';

@Component({
  selector: 'app-products-page',
  imports: [NgIf, NgFor, RouterLink, CardComponent, ButtonComponent, BadgeComponent],
  templateUrl: './products-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsPageComponent implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly productsService = inject(ProductsService);
  private readonly toastService = inject(ToastService);
  private readonly cartState = inject(CartStateService);
  private readonly currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });

  products: Product[] = [];
  isLoading = true;

  ngOnInit(): void {
    console.log('[ProductsPageComponent] ngOnInit()');

    this.productsService
      .listProducts()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: ProductsListResponse) => {
          console.log('[ProductsPageComponent] products received', {
            count: response.count,
            products: response.products,
          });

          this.products = Array.isArray(response.products) ? response.products : [];
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('[ProductsPageComponent] listProducts() failed', error);
          this.products = [];
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  addToCart(product: Product): void {
    this.cartState
      .addItem(product)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((response) => {
        if (isApiSuccessResponse(response)) {
          this.toastService.show({
            title: 'Added to cart',
            description: `${product.name} was added to your selection.`,
            variant: 'success',
          });
          return;
        }

        this.toastService.show({
          title: 'Unable to add item',
          description: response.error,
          variant: 'error',
        });
      });
  }

  formatPrice(price: number): string {
    return this.currencyFormatter.format(price);
  }

  stockVariant(stock: number): 'success' | 'warning' | 'danger' {
    if (stock > 15) {
      return 'success';
    }

    if (stock > 0) {
      return 'warning';
    }

    return 'danger';
  }

  stockLabel(stock: number): string {
    if (stock > 15) {
      return 'In stock';
    }

    if (stock > 0) {
      return `Only ${stock} left`;
    }

    return 'Sold out';
  }

  trackByProductId(_index: number, product: Product): string {
    return product.id;
  }
}
