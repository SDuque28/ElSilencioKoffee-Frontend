import { ChangeDetectionStrategy, Component, DestroyRef, inject, type OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { isApiSuccessResponse } from '../../../core/models/api-response.model';
import type { Product } from '../../../core/models/product.model';
import { BadgeComponent } from '../../../shared/ui/badge/badge.component';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { CardComponent } from '../../../shared/ui/card/card.component';
import { ProductsService } from '../services/products.service';

interface ProductCard {
  id: string;
  name: string;
  description: string;
  priceLabel: string;
  stockLabel: string;
  stockVariant: 'success' | 'warning' | 'danger';
}

@Component({
  selector: 'app-products-page',
  imports: [RouterLink, CardComponent, ButtonComponent, BadgeComponent],
  templateUrl: './products-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsPageComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly productsService = inject(ProductsService);
  private readonly currencyFormatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  });

  products: ProductCard[] = [];

  ngOnInit(): void {
    this.productsService
      .listProducts()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((response) => {
        this.products = isApiSuccessResponse(response)
          ? response.data.map((product) => this.toProductCard(product))
          : [];
      });
  }

  private toProductCard(product: Product): ProductCard {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      priceLabel: this.currencyFormatter.format(product.price),
      stockLabel:
        product.stock > 10 ? 'Available' : product.stock > 0 ? 'Low stock' : 'Out of stock',
      stockVariant: product.stock > 10 ? 'success' : product.stock > 0 ? 'warning' : 'danger',
    };
  }
}
