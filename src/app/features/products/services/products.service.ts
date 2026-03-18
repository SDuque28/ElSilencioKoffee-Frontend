import { Injectable } from '@angular/core';
import { delay, of, tap, type Observable } from 'rxjs';

import type { Product } from '../../../core/models/product.model';

const MOCK_PRODUCTS: Product[] = [
  {
    id: 'ethiopian-yirgacheffe',
    name: 'Ethiopian Yirgacheffe',
    price: 26,
    image:
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80',
    category: 'Single Origin',
    description: 'Floral cup with citrus brightness and a delicate tea-like finish.',
    stock: 24,
    featured: true,
  },
  {
    id: 'colombian-geisha-reserve',
    name: 'Colombian Geisha Reserve',
    price: 34,
    image:
      'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=1200&q=80',
    category: 'Premium Beans',
    description: 'Elegant micro-lot with panela sweetness, peach notes, and silky body.',
    stock: 12,
    featured: true,
  },
  {
    id: 'premium-coffee-bag',
    name: 'Premium Coffee Bag',
    price: 22,
    image:
      'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1200&q=80',
    category: 'House Blend',
    description: 'Balanced everyday roast crafted for espresso and filtered brewing.',
    stock: 34,
    featured: true,
  },
  {
    id: 'espresso-capsules',
    name: 'Espresso Capsules',
    price: 18,
    image:
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1200&q=80',
    category: 'Capsules',
    description: 'Rich crema, dark chocolate profile, and quick convenience for busy mornings.',
    stock: 46,
    featured: true,
  },
  {
    id: 'barista-pro-grinder',
    name: 'Barista Pro Grinder',
    price: 189,
    image:
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=80',
    category: 'Equipment',
    description: 'Precision burr grinder with stepped adjustment for espresso and pour over.',
    stock: 8,
  },
  {
    id: 'pour-over-kit',
    name: 'Pour Over Kit',
    price: 74,
    image:
      'https://images.unsplash.com/photo-1459755486867-b55449bb39ff?auto=format&fit=crop&w=1200&q=80',
    category: 'Brewing Kit',
    description: 'Glass dripper, server, and filters curated for a bright extraction.',
    stock: 15,
  },
  {
    id: 'ceramic-mug',
    name: 'Ceramic Mug',
    price: 16,
    image:
      'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=1200&q=80',
    category: 'Accessories',
    description: 'Hand-finished ceramic mug designed to keep your brew warm and stylish.',
    stock: 26,
  },
  {
    id: 'cold-brew-bottle',
    name: 'Cold Brew Bottle',
    price: 28,
    image:
      'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=1200&q=80',
    category: 'Accessories',
    description: 'Minimal glass bottle with stainless filter for smooth cold brew at home.',
    stock: 19,
  },
  {
    id: 'travel-tumbler',
    name: 'Travel Tumbler',
    price: 25,
    image:
      'https://images.unsplash.com/photo-1507914995485-5f7b7b1b2c14?auto=format&fit=crop&w=1200&q=80',
    category: 'Accessories',
    description: 'Double-wall insulated tumbler with leak-proof lid for coffee on the move.',
    stock: 21,
  },
  {
    id: 'signature-house-blend',
    name: 'Signature House Blend',
    price: 21,
    image:
      'https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&w=1200&q=80',
    category: 'Blend',
    description: 'Comforting roast with cocoa sweetness, caramel finish, and medium body.',
    stock: 29,
  },
];

@Injectable({
  providedIn: 'root',
})
export class ProductsService {
  listProducts(): Observable<Product[]> {
    console.log('[ProductsService] listProducts() called');

    return this.withLatency(MOCK_PRODUCTS.map((product) => ({ ...product }))).pipe(
      tap((products) => {
        console.log('[ProductsService] listProducts() resolved', {
          count: products.length,
          ids: products.map((product) => product.id),
        });
      }),
    );
  }

  listFeaturedProducts(): Observable<Product[]> {
    return this.withLatency(
      MOCK_PRODUCTS.filter((product) => product.featured).map((product) => ({ ...product })),
    );
  }

  listCollectionProducts(): Observable<Product[]> {
    return this.withLatency(
      MOCK_PRODUCTS.filter((product) =>
        ['Equipment', 'Brewing Kit', 'Accessories'].includes(product.category),
      )
        .slice(0, 4)
        .map((product) => ({ ...product })),
    );
  }

  getProduct(productId: string): Observable<Product | undefined> {
    console.log('[ProductsService] getProduct() called', { productId });

    const product = MOCK_PRODUCTS.find((item) => item.id === productId);
    return this.withLatency(product ? { ...product } : undefined).pipe(
      tap((result) => {
        console.log('[ProductsService] getProduct() resolved', {
          productId,
          found: Boolean(result),
        });
      }),
    );
  }

  private withLatency<T>(data: T): Observable<T> {
    return of(data).pipe(delay(this.randomLatency()));
  }

  private randomLatency(): number {
    return 100 + Math.floor(Math.random() * 201);
  }
}
