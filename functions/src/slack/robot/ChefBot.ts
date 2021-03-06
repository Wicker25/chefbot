/**
 * @file robot/ChefBot.ts
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

import { configs, getConnection } from '@puro/core';
import { BadRequestHttpException } from '@puro/core';

import { ExecutionInterruptedException } from './EventHandler';

import { HelpCommandHandler } from './HelpCommandHandler';
import { PullCatalogueCommandHandler } from './PullCatalogueCommandHandler';
import { ShowSuggestionsCommandHandler } from './ShowSuggestionsCommandHandler';
import { ShowCommandHandler } from './ShowCommandHandler';
import { RateCommandHandler } from './RateCommandHandler';
import { ShowCallbackHandler } from './ShowCallbackHandler';
import { RateCallbackHandler } from './RateCallbackHandler';
import { ReactionAddedHandler } from './ReactionAddedHandler';
import { ReactionRemovedHandler } from './ReactionRemovedHandler';

import { QueryFailedError } from 'typeorm';

import { WebClient } from '@slack/client';

export class ChefBot {
  public client: WebClient;

  protected registeredHandlers = [
    HelpCommandHandler,
    PullCatalogueCommandHandler,
    ShowSuggestionsCommandHandler,
    ShowCommandHandler,
    RateCommandHandler,
    ShowCallbackHandler,
    RateCallbackHandler,
    ReactionAddedHandler,
    ReactionRemovedHandler
  ];

  constructor() {
    this.client = new WebClient(configs.get('slack.accessToken'));
  }

  async handleEvent(event: any, force: boolean = false) {
    for (let i = 0; i < this.registeredHandlers.length; i++) {
      const registeredHandler = this.registeredHandlers[i];

      if (registeredHandler.testEvent(event)) {
        await this.execEventHandler(event, registeredHandler, force);
        return;
      }
    }

    throw new BadRequestHttpException();
  }

  private async execEventHandler(
    event: any,
    handlerClass: any,
    force: boolean
  ) {
    const { type, channel, ts } = event;

    try {
      // Make sure the request will be processed once
      if (type === 'app_mention' && !force) {
        const connection = await getConnection();
        await connection
          .createQueryBuilder()
          .insert()
          .into('user_request')
          .values({
            id: `${type}:${channel}:${ts}`,
            data: event,
            createdOn: () => 'NOW()'
          })
          .execute();
      }

      const handler = new handlerClass(this, event);
      await handler.execute();
    } catch (e) {
      if (
        e instanceof QueryFailedError ||
        e instanceof ExecutionInterruptedException
      ) {
        return;
      }

      throw e;
    }
  }
}
