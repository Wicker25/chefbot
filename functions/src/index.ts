/**
 * @file index.ts
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

import { Puro, configs } from '@puro/core';
import { CataloguePlugin } from './catalogue/plugin';
import { SlackPlugin } from './slack/plugin';

import * as functions from 'firebase-functions';

const config = functions.config();
process.env.PURO_PARAMS = Buffer.from(config.puro.params, 'base64').toString();

const puro = new Puro();

puro.install(new CataloguePlugin());
puro.install(new SlackPlugin());
puro.prepare();

export const handler = functions.https.onRequest(puro.server);

// Daily jobs
import { task as pullCatalogue } from './catalogue/tasks/pull_catalogue';
import { task as prepareRatings } from './catalogue/tasks/prepare_ratings';

import { ChefBot } from './slack/robot/ChefBot';

export const dailyPullCatalogue = functions.pubsub
  .topic('daily-job')
  .onPublish(async () => {
    await pullCatalogue();

    const chefBot = new ChefBot();
    await chefBot.handleEvent({
      type: 'app_mention',
      channel: configs.get('slack.mainChannel'),
      ts: new Date().getTime() / 1000,
      text: 'show suggestions'
    });

    return true;
  });

export const dailyPrepareRatings = functions.pubsub
  .topic('daily-job')
  .onPublish(async () => {
    await prepareRatings();
    return true;
  });
