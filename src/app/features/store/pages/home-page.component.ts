import { ChangeDetectionStrategy, Component, DestroyRef, inject, type OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import type { Product } from '../../../core/models/product.model';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { CardComponent } from '../../../shared/ui/card/card.component';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { ProductsService } from '../../products/services/products.service';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink, ButtonComponent, CardComponent],
  templateUrl: './home-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePageComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly productsService = inject(ProductsService);
  private readonly toastService = inject(ToastService);
  private readonly currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });

  readonly heroImage =
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1600&q=80';

  featuredProducts: Product[] = [];
  collectionProducts: Product[] = [];

  ngOnInit(): void {
    this.productsService
      .listFeaturedProducts()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((products) => {
        this.featuredProducts = products.slice(0, 4);
      });

    this.productsService
      .listCollectionProducts()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((products) => {
        this.collectionProducts = products;
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
}
