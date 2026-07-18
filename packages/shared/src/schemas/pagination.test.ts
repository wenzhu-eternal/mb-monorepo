import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { PaginatedResponseSchema } from './pagination'

describe('PaginatedResponseSchema', () => {
  const ItemSchema = z.object({ id: z.number() })
  const Schema = PaginatedResponseSchema(ItemSchema)

  it('合法数据通过', () => {
    expect(
      Schema.safeParse({
        list: [{ id: 1 }, { id: 2 }],
        total: 2,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      }).success,
    ).toBe(true)
  })

  it('list 字段名错误失败（不能用 items）', () => {
    expect(
      Schema.safeParse({
        items: [{ id: 1 }],
        total: 1,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      }).success,
    ).toBe(false)
  })

  it('空表时 total 为 0 通过（min(0) 允许空表场景）', () => {
    expect(
      Schema.safeParse({
        list: [],
        total: 0,
        page: 1,
        pageSize: 10,
        totalPages: 0,
      }).success,
    ).toBe(true)
  })

  it('total 负数失败', () => {
    expect(
      Schema.safeParse({
        list: [],
        total: -1,
        page: 1,
        pageSize: 10,
        totalPages: 0,
      }).success,
    ).toBe(false)
  })
})
