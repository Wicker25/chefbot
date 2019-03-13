/**
 * @file tasks/prepare_ratings.ts
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

import { getConnection } from '@puro/core';

import { Product } from '../entities/Product';

export const task = async () => {
  const connection = await getConnection();

  // Reset the product ratings
  await connection
    .createQueryBuilder()
    .update('product')
    .set({
      rating: 0,
      totalReviews: 0,
      totalPositiveReviews: 0,
      totalNegativeReviews: 0,
      totalDelayed: 0,
      totalCold: 0
    })
    .execute();

  // Retrieve the user reactions
  // prettier-ignore
  const productRatings = await connection
    .createQueryBuilder()
    .select('productId')
    .addSelect('SUM(CASE WHEN pr.reaction = "+1" THEN 1 ELSE 0 END)', 'totalPositiveReviews')
    .addSelect('SUM(CASE WHEN pr.reaction = "-1" THEN 1 ELSE 0 END)', 'totalNegativeReviews')
    .addSelect('SUM(CASE WHEN pr.reaction = "stopwatch" THEN 1 ELSE 0 END)', 'totalDelayed')
    .addSelect('SUM(CASE WHEN pr.reaction = "snowflake" THEN 1 ELSE 0 END)', 'totalCold')
    .from('product_reaction', 'pr')
    .groupBy('pr.productId')
    .addGroupBy('pr.productSurveyId')
    .addGroupBy('pr.userId')
    .getRawMany();

  const productRatingsMap = productRatings.reduce((output, productRating) => {
    const { productId, ...ratings } = productRating;
    output[productId] = ratings;
    return output;
  }, {});

  // Set the new product ratings
  await connection.transaction(async entityManager => {
    const productRepository = await entityManager.getRepository(Product);
    const products = await productRepository.find();

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const productRating = productRatingsMap[product.id];

      if (typeof productRating === 'undefined') {
        continue;
      }

      product.totalPositiveReviews = +productRating.totalPositiveReviews;
      product.totalNegativeReviews = +productRating.totalNegativeReviews;
      product.totalReviews =
        product.totalPositiveReviews + product.totalNegativeReviews;
      product.totalDelayed = productRating.totalDelayed;
      product.totalCold = productRating.totalCold;

      product.rating =
        (product.totalPositiveReviews / product.totalReviews) * 5.0;

      await productRepository.save(product);
    }
  });
};
