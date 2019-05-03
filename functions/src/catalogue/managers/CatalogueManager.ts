/**
 * @file managers/CatalogueManager.ts
 *
 * Copyright (C) 2019 | Giacomo Trudu aka `Wicker25`
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { configs, getRepository } from '@puro/core';

import { Restaurant } from '../entities/Restaurant';
import { Product } from '../entities/Product';

import { Client } from '../../lunch-team/Client';
import { Catalogue } from '../../lunch-team/models/Catalogue';
import { Restaurant as RestaurantModel } from '../../lunch-team/models/Restaurant';
import { Product as ProductModel } from '../../lunch-team/models/Product';

// prettier-ignore
const ALLERGEN_RE =
  '(' +
  [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
    'g', 'cr', 'e', 'f', 'p', 's', 'd', 'n', 'c', 'm', 'ss', 'sd', 'l', 'ml',
    'gluten', 'cereal', 'wheat', 'crustaceans', 'eggs', 'fish', 'peanuts',
    'soybeans', 'milk', 'nuts', 'almonds', 'hazelnuts', 'walnuts', 'cashews',
    'celery', 'mustard', 'sesame', 'sulphur', 'lupin', 'molluscs',
  ].join('|') + ')';

// prettier-ignore
const ALLERGEN_MAP: { [key: string]: number } = {
  g: 1, cr: 2, e: 3, f: 4, p: 5, s: 6, d: 7,
  n: 8, c: 9, m: 10, ss: 11, sd: 12, l: 13, ml: 14,
  gluten: 1,
  cereal: 1,
  wheat: 1,
  crustaceans: 2,
  eggs: 3,
  fish: 4,
  peanuts: 5,
  soybeans: 6,
  milk: 7,
  nuts: 8,
  almonds: 8,
  hazelnuts: 8,
  walnuts: 8,
  cashews: 8,
  celery: 9,
  mustard: 10,
  sesame: 11,
  sulphur: 12,
  lupin: 13,
  molluscs: 14
};

const PRODUCT_ENERGY_RE = /([0-9]+)\\s*[k]cal/gi;

const PRODUCT_ALLERGENS_FMT1_RE = new RegExp(
  `\((${ALLERGEN_RE}\\s*(,\\s*${ALLERGEN_RE})*)\)`,
  'ig'
);

const PRODUCT_ALLERGENS_FMT2_RE = new RegExp(
  `allergen\\s+(${ALLERGEN_RE}\\s*(,\\s*${ALLERGEN_RE})*)`,
  'ig'
);

const PRODUCT_LEGENT_VEGETARIAN_RE = /(veggie|vegetarian)/gi;
const PRODUCT_LEGENT_VEGAN_RE = /vegan/gi;
const PRODUCT_LEGENT_PORK_RE = /pork/gi;

export class CatalogueManager {
  private client: Client;

  constructor() {
    this.client = new Client();
  }

  async pullCatalogue() {
    await this.client.login(
      configs.get('lunchTeam.email'),
      configs.get('lunchTeam.password')
    );

    const catalogue = await this.client.getCatalogue();
    await this.updateEntities(catalogue);
  }

  private async updateEntities(catalogue: Catalogue) {
    const restaurants = catalogue.businessDelivery;

    for (let i = 0; i < restaurants.length; i++) {
      await this.updateRestaurant(restaurants[i]);
    }
  }

  private async updateRestaurant(restaurantModel: RestaurantModel) {
    console.log('Update restaurant: ' + restaurantModel.name);

    const productRestaurant = await getRepository(Restaurant);

    const restaurant =
      (await productRestaurant.findOne({
        lunchTeamId: restaurantModel.id
      })) || new Restaurant();

    restaurant.lunchTeamId = restaurantModel.id;
    restaurant.name = this.normalizeText(restaurantModel.name);
    restaurant.address = restaurantModel.address;
    restaurant.closeTime = restaurantModel.openingHour.closeHour;

    await productRestaurant.save(restaurant);

    const categories = restaurantModel.categoryType;

    for (let i = 0; i < categories.length; i++) {
      const products = await this.client.getProducts(
        restaurantModel,
        categories[i]
      );

      for (let j = 0; j < products.length; j++) {
        await this.updateProduct(restaurant, products[j]);
      }
    }
  }

  private async updateProduct(
    restaurant: Restaurant,
    productModel: ProductModel
  ) {
    console.log('Update product: ' + productModel.name);

    const productRepository = await getRepository(Product);

    const product =
      (await productRepository.findOne({
        lunchTeamId: productModel.id
      })) || new Product();

    product.lunchTeamId = productModel.id;
    product.name = this.normalizeText(productModel.name);
    product.description = this.normalizeText(productModel.description);
    product.restaurant = restaurant;
    product.availableOn = new Date();

    this.setProductEnergy(product, productModel);
    this.setProductAllergens(product, productModel);
    this.setProductLegend(product, productModel);

    await productRepository.save(product);
  }

  private setProductEnergy(product: Product, productModel: ProductModel) {
    const matches = PRODUCT_ENERGY_RE.exec(
      `${productModel.name} ${productModel.description}`
    );

    if (matches) {
      product.energy = parseInt(matches[1], 10);
    }
  }

  private setProductAllergens(product: Product, productModel: ProductModel) {
    const payload = `${productModel.name} ${productModel.description}`;

    let matches = PRODUCT_ALLERGENS_FMT1_RE.exec(payload);

    if (!matches) {
      matches = PRODUCT_ALLERGENS_FMT2_RE.exec(payload);
    }

    if (matches) {
      const allergens = matches[1]
        .toLowerCase()
        .split(/\s*,\s*/)
        .map(allergen => this.normalizeAllergen(allergen));

      product.allergens = allergens.join(',');
    }
  }

  private setProductLegend(product: Product, productModel: ProductModel) {
    const payload = `${productModel.name} ${productModel.description}`;

    if (PRODUCT_LEGENT_VEGAN_RE.test(payload)) {
      product.legend = 'VE';
    } else if (PRODUCT_LEGENT_VEGETARIAN_RE.test(payload)) {
      product.legend = 'VG';
    } else if (PRODUCT_LEGENT_PORK_RE.test(payload)) {
      product.legend = 'P';
    }
  }

  private normalizeText(text: string) {
    return text
      .replace(/\([^\)]*\)/g, '')
      .replace(/\*/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private normalizeAllergen(allergen: string) {
    const normalizedAllergen = ALLERGEN_MAP[allergen];

    if (normalizedAllergen) {
      return normalizedAllergen;
    }

    return parseInt(allergen, 10);
  }
}
