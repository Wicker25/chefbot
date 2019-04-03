/**
 * @file robot/RateCommandHandler.ts
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
import { ProductSurvey } from '../../catalogue/entities/ProductSurvey';
import { StorageManager } from '../../catalogue/managers/StorageManager';

import { UserRequest } from '../entities/UserRequest';
import { EventHandler } from './EventHandler';

export class RateCommandHandler extends EventHandler {
  static testEvent(event: any) {
    const { type, text } = event;
    return type === 'app_mention' && text.match(/\brate\s+(.*)?/gi);
  }

  async execute() {
    const { type, channel, ts, user: userId, text, files } = this.event;

    const [command, description] = /\brate\s+(.*)?/gi.exec(text) as string[];

    const products = await this.searchProducts(description);

    if (products.length > 1) {
      const callbackId = `rate:${ts}`;
      await this.postProductMenu(products, callbackId);

      // Associate the request to the callback
      const userRequestRepository = await getRepository(UserRequest);
      const userRequest = await userRequestRepository.findOneOrFail({
        id: `${type}:${channel}:${ts}`
      });

      userRequest.callbackId = callbackId;
      await userRequestRepository.save(userRequest);
      return;
    }

    const product = products[0];
    const user = await this.getUser(userId);

    if (files) {
      await this.updateProductImage(product, files[0]);

      // Thank the user for the picture
      await this.addReaction({
        name: 'thankyou',
        channel,
        timestamp: ts
      });
    }

    const response = await this.postMessage({
      text:
        'What do you think, folks? Did you try it too?\n' +
        ':+1: = I liked it! ~ ' +
        ':-1: = I didn’t like it! ~ ' +
        ':stopwatch: = It was in late! ~ ' +
        ':snowflake: = It was cold!',
      attachments: [
        {
          color: '#36a64f',
          author_name: user.profile.real_name_normalized,
          author_icon: user.profile.image_original,
          text: product.name,
          image_url: product.imageUrl
        }
      ]
    });

    const { channel: surveyChannel, ts: surveyTs } = response;

    const productSurveyRepository = await getRepository(ProductSurvey);

    const productSurvey = new ProductSurvey();
    productSurvey.product = product;
    productSurvey.messageId = `${surveyChannel}:${surveyTs}`;

    await productSurveyRepository.save(productSurvey);
  }

  private async updateProductImage(product: Product, file: any) {
    const filename = `${product.id}-image.${file.filetype}`;

    const storageManager = new StorageManager();
    const fileStream = storageManager.createWriteStream(filename);

    await this.downloadFile(fileStream, file.url_private);

    product.imageUrl = storageManager.getFileUrl(filename);
    await this.saveProduct(product);
  }
}
