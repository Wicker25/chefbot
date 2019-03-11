/**
 * @file entities/Product.ts
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

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn
} from 'typeorm';

import { Restaurant } from './Restaurant';

@Entity()
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  lunchTeamId!: number;

  @Column({ length: 1024 })
  name!: string;

  @Column({ length: 2048 })
  description!: string;

  @Column({ length: 2048, nullable: true })
  imageUrl!: string;

  @ManyToOne(type => Restaurant, { eager: true })
  @JoinColumn()
  restaurant!: Restaurant;

  @Column({ default: 0 })
  rating!: number;

  @Column({ default: 0 })
  totalReviews!: number;

  @Column({ default: 0 })
  totalPositiveReviews!: number;

  @Column({ default: 0 })
  totalNegativeReviews!: number;

  @Column({ default: 0 })
  totalDelayed!: number;

  @Column({ default: 0 })
  totalCold!: number;

  @Column('date')
  availableOn!: Date;

  @Column({ default: false })
  isDisabled!: boolean;
}
