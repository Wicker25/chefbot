/**
 * @file bot/ShowSuggestionsProductsHandler.ts
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

import { getRepository } from '@puro/core';

import { Product } from '../../catalogue/entities/Product';
import { EventHandler } from './EventHandler';

export class ShowSuggestionsProductsHandler extends EventHandler {
  static testEvent(event: any) {
    const { type, text } = event;
    return type === 'app_mention' && text.match(/\bshow\s+suggestions\s*/gi);
  }

  async execute() {
    const { channel } = this.event;

    const productRepository = await getRepository(Product);
    const products = await productRepository
      .createQueryBuilder('product')
      .innerJoinAndSelect('product.restaurant', 'restaurant')
      .where('product.rating > 0 AND product.availableOn = CURRENT_DATE()')
      .orderBy('product.rating', 'DESC')
      .limit(10)
      .getMany();

    if (!products.length) {
      return;
    }

    await this.postMessage({
      channel: channel,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: 'Good morning, folks! Here is the Chef’s selection for today!'
          }
        },
        { type: 'divider' }
      ].concat(products.map(product => this.createProductSection(product)))
    });
  }

  private createProductSection(product: Product) {
    return {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text:
          `*${product.name} by ${product.restaurant.name}*\n` +
          `${':star:'.repeat(product.rating)} ` +
          `${product.totalReviews} reviews ~ ` +
          `:stopwatch: ${product.totalDelayed} ~ ` +
          `:snowflake: ${product.totalCold}\n` +
          `${product.description}`
      },
      accessory: {
        type: 'image',
        image_url: product.imageUrl,
        alt_text: 'product picture'
      }
    };
  }
}
