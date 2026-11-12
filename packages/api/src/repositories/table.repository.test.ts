import { SqliteTableRepository } from './table.repository.js'
import { Database } from '@config/database.js'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import type { Table } from '@models/table.model.js'

describe('SqliteTableRepository (Integration)', () => {
    let db: Database
    let repo: SqliteTableRepository

    const table = (over: Partial<Table> = {}): Table => ({
        id: 't1', restaurantId: 'r1', number: 1, description: 'Terraza', capacity: 4, status: 'libre', ...over
    })

    beforeAll(async () => {
        process.env.NODE_ENV = 'test'
        db = new Database()
        await db.initialize()
        repo = new SqliteTableRepository(db)
        for (const id of ['r1', 'r2']) {
            await db.run(
                'INSERT INTO restaurants (id, name, address, email, phone, owner_first_name, owner_last_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [id, 'Rest ' + id, 'Calle 1', `${id}@x.com`, '+34 612345678', 'A', 'B', new Date().toISOString(), new Date().toISOString()]
            )
        }
    })

    afterAll(async () => {
        await db.close()
    })

    it('guarda y encuentra una mesa por id', async () => {
        await repo.save(table())
        expect(await repo.findById('t1')).toEqual(table())
        expect(await repo.findById('nope')).toBeNull()
    })

    it('actualiza una mesa existente', async () => {
        await repo.save(table({ description: 'Interior', capacity: 6, status: 'reservada' }))
        expect(await repo.findById('t1')).toEqual(table({ description: 'Interior', capacity: 6, status: 'reservada' }))
    })

    it('lista por restaurante ordenadas por número', async () => {
        await repo.save(table({ id: 't3', number: 3 }))
        await repo.save(table({ id: 't2', number: 2 }))
        await repo.save(table({ id: 'o1', restaurantId: 'r2', number: 1 }))
        const res = await repo.findByRestaurantId('r1')
        expect(res.map(t => t.number)).toEqual([1, 2, 3])
    })

    it('busca por número dentro del restaurante', async () => {
        expect((await repo.findByNumber('r1', 2))?.id).toBe('t2')
        expect(await repo.findByNumber('r1', 99)).toBeNull()
    })

    it('respeta UNIQUE(restaurant_id, number) y permite el mismo número en otro restaurante', async () => {
        await expect(repo.save(table({ id: 'dup', number: 2 }))).rejects.toThrow()
        await expect(repo.save(table({ id: 'ok', restaurantId: 'r2', number: 2 }))).resolves.toBeUndefined()
    })

    it('occupyIfFree devuelve true solo la primera vez', async () => {
        await repo.save(table({ id: 'f1', number: 10, status: 'libre' }))
        expect(await repo.occupyIfFree('r1', 'f1')).toBe(true)
        expect((await repo.findById('f1'))?.status).toBe('ocupada')
        expect(await repo.occupyIfFree('r1', 'f1')).toBe(false)
    })

    it('occupyIfFree no ocupa mesas de otro restaurante ni reservadas', async () => {
        await repo.save(table({ id: 'f2', number: 11, status: 'libre' }))
        expect(await repo.occupyIfFree('r2', 'f2')).toBe(false)
        await repo.save(table({ id: 'f3', number: 12, status: 'reservada' }))
        expect(await repo.occupyIfFree('r1', 'f3')).toBe(false)
    })

    it('elimina una mesa', async () => {
        await repo.delete('t3')
        expect(await repo.findById('t3')).toBeNull()
    })
})
