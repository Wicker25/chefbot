/**
 * @file robot/ShowCommandHandler.ts
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

import { UserRequest } from '../entities/UserRequest';
import { EventHandler } from './EventHandler';

export class ShowCommandHandler extends EventHandler {
  static testEvent(event: any) {
    const { type, text } = event;
    return type === 'app_mention' && text.match(/\bshow\s+(.*)?/gi);
  }

  async execute() {
    const { type, channel, ts, text } = this.event;

    const [command, description] = /\bshow\s+(.*)?/gi.exec(text) as string[];

    const products = await this.searchProducts(description);

    if (products.length > 1) {
      const callbackId = `show:${ts}`;
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

    await this.postMessage({
      text: 'Here is',
      attachments: [
        {
          color: '#36a64f',
          text: this.createProductMessage(product),
          image_url: product.imageUrl
        }
      ]
    });
  }
}
