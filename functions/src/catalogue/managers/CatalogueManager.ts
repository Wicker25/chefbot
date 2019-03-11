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
    restaurant.name = restaurantModel.name;
    restaurant.address = restaurantModel.address;

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
    product.name = productModel.name;
    product.description = productModel.description;
    product.restaurant = restaurant;
    product.availableOn = new Date();

    this.normalizeProduct(product);

    await productRepository.save(product);
  }

  private normalizeProduct(product: Product) {
    product.name = product.name.trim();
    product.description = product.description.trim();
  }
}
