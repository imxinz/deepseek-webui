import { Entity, Column, PrimaryGeneratedColumn, BeforeInsert, Index } from 'typeorm';
import 'reflect-metadata';

//股票每日交易数据
@Index(['symbol', 'date'])
@Entity()
export class StockTrade {
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

  // 当前交易价格，存储为字符串以保留精度
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 3,
    comment: '当前股票的交易价格，精确到小数点后 3 位'
  })
  trade!: string;

  // 价格变化值
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    comment: '股票价格相较于前一日的变化值，精确到小数点后 2 位'
  })
  pricechange!: number;

  // 价格变化百分比
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 3,
    comment: '股票价格变化的百分比，精确到小数点后 3 位'
  })
  @Index()
  changepercent!: number;

  // 前一日结算价格，存储为字符串以保留精度
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 3,
    comment: '前一日股票的结算价格，精确到小数点后 3 位'
  })
  settlement!: string;

  // 开盘价格，存储为字符串以保留精度
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 3,
    comment: '股票当日的开盘价格，精确到小数点后 3 位'
  })
  open!: string;

  // 最高价，存储为字符串以保留精度
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 3,
    comment: '股票当日的最高交易价格，精确到小数点后 3 位'
  })
  high!: string;

  // 最低价，存储为字符串以保留精度
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 3,
    comment: '股票当日的最低交易价格，精确到小数点后 3 位'
  })
  low!: string;

  // 成交量
  @Column({
    comment: '股票当日的成交数量'
  })
  volume!: number;

  // 成交额
  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    comment: '股票当日的成交金额，精确到小数点后 2 位'
  })
  amount!: number;

  // 交易时间
  @Column({
    comment: '股票交易数据对应的时间'
  })
  ticktime!: string;

  // 市盈率
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 3,
    comment: '股票的市盈率，精确到小数点后 3 位'
  })
  per!: number;

  // 市净率
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 3,
    comment: '股票的市净率，精确到小数点后 3 位'
  })
  pb!: number;

  // 总市值
  @Column({
    type: 'decimal',
    precision: 15,
    scale: 4,
    comment: '公司的总市值，精确到小数点后 4 位'
  })
  mktcap!: number;

  // 流通市值
  @Column({
    type: 'decimal',
    precision: 15,
    scale: 4,
    comment: '公司的流通市值，精确到小数点后 4 位'
  })
  nmc!: number;

  // 换手率
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 5,
    comment: '股票的换手率，精确到小数点后 5 位'
  })
  @Index()
  turnoverratio!: number;

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