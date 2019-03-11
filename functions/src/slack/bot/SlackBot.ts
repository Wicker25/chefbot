/**
 * @file bot/SlackBot.ts
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

import { configs } from '@puro/core';

import { ShowProductHandler } from './ShowProductHandler';
import { ShowMostPopularProductsHandler } from './ShowMostPopularProductsHandler';
import { RateProductHandler } from './RateProductHandler';
import { ReactionAddedHandler } from './ReactionAddedHandler';
import { ReactionRemovedHandler } from './ReactionRemovedHandler';

import { WebClient } from '@slack/client';

export class SlackBot {
  private client: WebClient;

  private registeredHandlers = [
    ShowMostPopularProductsHandler,
    ShowProductHandler,
    RateProductHandler,
    ReactionAddedHandler,
    ReactionRemovedHandler
  ];

  constructor() {
    this.client = new WebClient(configs.get('slack.accessToken'));
  }

  async handleEvent(event: any) {
    for (let i = 0; i < this.registeredHandlers.length; i++) {
      const registeredHandler = this.registeredHandlers[i];

      if (registeredHandler.testEvent(event)) {
        const handler = new registeredHandler(this.client, event);
        await handler.execute();
        break;
      }
    }
  }
}
