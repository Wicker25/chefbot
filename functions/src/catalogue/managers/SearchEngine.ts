/**
 * @file tasks/CatalogueManager.ts
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

import { Product } from '../entities/Product';

import { Raw } from 'typeorm';

import * as algoliasearch from 'algoliasearch';

export class NoResultsException extends Error {}
export class TooManyResultsException extends Error {}

export class SearchEngine {
  private client: algoliasearch.Client;
  private productIndex: algoliasearch.Index;

  constructor() {
    this.client = algoliasearch(
      configs.get('algolia.applicationId'),
      configs.get('algolia.apiKey')
    );

    this.productIndex = this.client.initIndex('products');
  }

  async searchProduct(query: string): Promise<Product> {
    const results = await this.productIndex.search({ query });

    if (!results.hits.length) {
      throw new NoResultsException();
    }

    if (results.hits.length > 1) {
      throw new TooManyResultsException();
    }

    try {
      const productRepository = await getRepository(Product);
      return productRepository.findOneOrFail({ id: results.hits[0].id });
    } catch (e) {
      throw new NoResultsException();
    }
  }

  async reindex() {
    const productRepository = await getRepository(Product);
    const products = await productRepository.find({
      availableOn: Raw(alias => `${alias} = CURRENT_DATE()`)
    });

    const productObjects = products.map((product: Product) =>
      this.createProductObject(product)
    );

    await this.productIndex.saveObjects(productObjects);
  }

  private createProductObject(product: Product) {
    return {
      objectID: product.id,
      id: product.id,
      name: product.name,
      description: product.description,
      restaurant: product.restaurant.name
    };
  }
}
