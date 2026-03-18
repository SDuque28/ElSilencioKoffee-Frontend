import { ChangeDetectionStrategy, Component, DestroyRef, inject, type OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { isApiSuccessResponse } from '../../../core/models/api-response.model';
import type { Product } from '../../../core/models/product.model';
import { BadgeComponent } from '../../../shared/ui/badge/badge.component';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { CardComponent } from '../../../shared/ui/card/card.component';
import { ProductsService } from '../services/products.service';

@Component({
  selector: 'app-product-detail-page',
  imports: [RouterLink, CardComponent, ButtonComponent, BadgeComponent],
  templateUrl: './product-detail-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailPageComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly productsService = inject(ProductsService);
  private readonly currencyFormatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  });

  readonly productId = this.route.snapshot.paramMap.get('id') ?? 'N/A';
  product: Product | null = null;
  loadError: string | null = null;

  get priceLabel(): string {
    return this.product ? this.currencyFormatter.format(this.product.price) : '$ 0';
  }

  get stockVariant(): 'success' | 'warning' | 'danger' {
    if (!this.product || this.product.stock <= 0) {
      return 'danger';
    }

    return this.product.stock > 10 ? 'success' : 'warning';
  }

  get stockLabel(): string {
    if (!this.product || this.product.stock <= 0) {
      return 'Out of stock';
    }

    return this.product.stock > 10
      ? `Stock ${this.product.stock}`
      : `Only ${this.product.stock} left`;
  }

  ngOnInit(): void {
    this.productsService
      .getProduct(this.productId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((response) => {
        if (isApiSuccessResponse(response)) {
          this.product = response.data;
          this.loadError = null;
          return;
        }

        this.product = null;
        this.loadError = response.error;
      });
  }
}
