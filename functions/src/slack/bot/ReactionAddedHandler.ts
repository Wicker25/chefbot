/**
 * @file bot/ReactionAddedHandler.ts
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

import { ProductSurvey } from '../../catalogue/entities/ProductSurvey';
import { ProductReaction } from '../../catalogue/entities/ProductReaction';
import { EventHandler } from './EventHandler';

export class ReactionAddedHandler extends EventHandler {
  static testEvent(event: any) {
    return event.type === 'reaction_added';
  }

  async execute() {
    const { user: userId, item, reaction } = this.event;
    const { channel: surveyChannel, ts: surveyTs } = item;

    const normalizedReaction = this.normalizeReaction(reaction);

    if (!normalizedReaction) {
      return;
    }

    const productSurveyRepository = await getRepository(ProductSurvey);
    const productSurvey = await productSurveyRepository.findOne({
      messageId: `${surveyChannel}:${surveyTs}`
    });

    if (!productSurvey) {
      return;
    }

    const productReactionRepository = await getRepository(ProductReaction);

    const productReaction = new ProductReaction();
    productReaction.product = productSurvey.product;
    productReaction.productSurvey = productSurvey;
    productReaction.userId = userId;
    productReaction.reaction = reaction;

    await productReactionRepository.save(productReaction);
  }

  private normalizeReaction(reaction: string) {
    if (['+1', '-1', 'stopwatch', 'snowflake'].includes(reaction)) {
      return reaction;
    }

    if (/^\+1(::skin-tone-[1-5])?$/.test(reaction)) {
      return '+1';
    }

    if (/^-1(::skin-tone-[1-5])?$/.test(reaction)) {
      return '-1';
    }
  }
}
