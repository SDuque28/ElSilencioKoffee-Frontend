import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { BadgeComponent } from '../../../shared/ui/badge/badge.component';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { CardComponent } from '../../../shared/ui/card/card.component';

interface ProductCard {
  id: string;
  name: string;
  description: string;
  price: string;
  tag: 'new' | 'featured' | 'organic';
}

@Component({
  selector: 'app-products-page',
  imports: [RouterLink, CardComponent, ButtonComponent, BadgeComponent],
  templateUrl: './products-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsPageComponent {
  readonly products: ProductCard[] = [
    {
      id: '1',
      name: 'Volcanic Roast',
      description: 'Dark roast with cocoa and caramel profile from mountain farms.',
      price: '$18.90',
      tag: 'featured',
    },
    {
      id: '2',
      name: 'Forest Honey Blend',
      description: 'Medium roast with citrus acidity and floral finish.',
      price: '$16.20',
      tag: 'new',
    },
    {
      id: '3',
      name: 'Organic Sierra Beans',
      description: 'Certified organic beans with balanced body and sweet aroma.',
      price: '$21.00',
      tag: 'organic',
    },
  ];

  badgeVariant(tag: ProductCard['tag']): 'warning' | 'success' | 'neutral' {
    if (tag === 'new') {
      return 'warning';
    }

    if (tag === 'organic') {
      return 'success';
    }

    return 'neutral';
  }
}
