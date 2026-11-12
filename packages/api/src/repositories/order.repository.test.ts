import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { SqliteOrderRepository } from './order.repository.js'
import { SqliteTableRepository } from './table.repository.js'
import { Database } from '@config/database.js'
import type { Order } from '@models/order.model.js'

describe('SqliteOrderRepository - tableNumber (Integration)', () => {
    let db: Database
    let orders: SqliteOrderRepository
    let tables: SqliteTableRepository

    const order = (id: string, tableId: string | null): Order => ({
        id, restaurantId: 'r1', tableId, clientId: 'c1', createdAt: new Date(),
        items: [{ id: `${id}-i`, dishId: 'd1', quantity: 1, notes: null, status: 'pendiente' }]
    })

    beforeAll(async () => {
        process.env.NODE_ENV = 'test'
        db = new Database()
        await db.initialize()
        orders = new SqliteOrderRepository(db)
        tables = new SqliteTableRepository(db)
        const now = new Date().toISOString()
        await db.run(
            'INSERT INTO restaurants (id, name, address, email, phone, owner_first_name, owner_last_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            ['r1', 'Rest', 'Calle 1', 'r1@x.com', '+34 612345678', 'A', 'B', now, now]
        )
        await db.run(
            'INSERT INTO dishes (id, name, description, price, category, restaurant_id, available, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            ['d1', 'Plato', 'desc', 5, 'principal', 'r1', 1, now, now]
        )
        await tables.save({ id: 't1', restaurantId: 'r1', number: 7, description: '', capacity: 4, status: 'ocupada' })
        await orders.create(order('o1', 't1'))
        await orders.create(order('o2', null))
        await orders.create(order('o3', 'borrada'))
    })

    afterAll(async () => {
        await db.close()
    })

    it('findById devuelve tableNumber', async () => {
        expect((await orders.findById('o1'))?.tableNumber).toBe(7)
        expect((await orders.findById('o2'))?.tableNumber).toBeNull()
    })

    it('findActiveByRestaurant devuelve tableNumber (null si no hay mesa)', async () => {
        const res = await orders.findActiveByRestaurant('r1')
        expect(res.find(o => o.id === 'o1')?.tableNumber).toBe(7)
        expect(res.find(o => o.id === 'o2')?.tableNumber).toBeNull()
        expect(res.find(o => o.id === 'o3')?.tableNumber).toBeNull()
    })

    it('findByClientId devuelve tableNumber', async () => {
        const res = await orders.findByClientId('c1')
        expect(res.find(o => o.id === 'o1')?.tableNumber).toBe(7)
    })

    it('tras borrar la mesa el pedido conserva tableId y tableNumber pasa a null', async () => {
        await tables.delete('t1')
        const o = await orders.findById('o1')
        expect(o?.tableId).toBe('t1')
        expect(o?.tableNumber).toBeNull()
    })
})
