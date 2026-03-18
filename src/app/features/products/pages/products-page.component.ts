import { NgFor, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, type OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import type { Product } from '../../../core/models/product.model';
import { BadgeComponent } from '../../../shared/ui/badge/badge.component';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { CardComponent } from '../../../shared/ui/card/card.component';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { ProductsService } from '../services/products.service';

@Component({
  selector: 'app-products-page',
  imports: [NgIf, NgFor, RouterLink, CardComponent, ButtonComponent, BadgeComponent],
  templateUrl: './products-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsPageComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly productsService = inject(ProductsService);
  private readonly toastService = inject(ToastService);
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
        next: (products) => {
          console.log('[ProductsPageComponent] products received', {
            count: products.length,
            products,
          });

          this.products = products;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('[ProductsPageComponent] listProducts() failed', error);
          this.products = [];
          this.isLoading = false;
        },
      });
  }

  addToCart(product: Product): void {
    console.log('[MOCK CART] add product', product.id);
    this.toastService.show({
      title: 'Added to cart',
      description: `${product.name} was added in mock mode.`,
      variant: 'success',
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
