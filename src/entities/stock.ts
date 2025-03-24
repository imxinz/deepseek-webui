import { Entity, Column, PrimaryGeneratedColumn, BeforeInsert, Index } from 'typeorm';
import 'reflect-metadata';

//股票池数据
@Index(['symbol'])
@Entity()
export class Stock {
  @PrimaryGeneratedColumn()
  id!: number;

  // 股票代码标识
  @Column({ comment: '股票代码（带市场标识）' })
  symbol!: string;

  // 股票代码
  @Column({
    comment: '股票的数字代码'
  })
  @Index()
  code!: string;

  // 股票名称
  @Column({
    comment: '股票对应的公司名称'
  })
  @Index()
  name!: string;

  // 所属板块与题材
  @Column({
    nullable: true,
    comment: '所属行业'
  })
  @Index()
  industry!: string;

  // 所在地区
  @Column({
    nullable: true,
    comment: '所在地区'
  })
  @Index()
  region!: string;

  // 题材
  @Column({
    type: 'text', 
    nullable: true,
    comment: '关联题材'
  })
  subject!: string;

  // 记录日期
  @Column({
    type: 'varchar',
    length: 8,
    comment: '记录日期（格式YYYYMMDD）',
    nullable: false // 明确设置为不可为空
  })
  @Index()
  date!: string;

  
}