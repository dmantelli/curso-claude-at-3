import { Database } from '@config/database.js'
import type { Table } from '@models/table.model.js'
import { normalizeTableStatus } from '@models/table.model.js'

interface TableRow {
    id: string
    restaurantId: string
    number: number
    description: string
    capacity: number
    status: string
}

const SELECT = 'SELECT id, restaurant_id as restaurantId, number, description, capacity, status FROM tables'

export interface TableRepository {
    findById(id: string): Promise<Table | null>
    findByRestaurantId(restaurantId: string): Promise<Table[]>
    findByNumber(restaurantId: string, number: number): Promise<Table | null>
    save(table: Table): Promise<void>
    delete(id: string): Promise<void>
    /** Pasa la mesa de libre a ocupada de forma atómica. Devuelve true solo si se ha ocupado. */
    occupyIfFree(restaurantId: string, id: string): Promise<boolean>
}

export class SqliteTableRepository implements TableRepository {
    constructor(private readonly db: Database) {}

    async findById(id: string): Promise<Table | null> {
        const row = await this.db.get<TableRow>(`${SELECT} WHERE id = ?`, [id])
        return row ? this.mapToTable(row) : null
    }

    async findByRestaurantId(restaurantId: string): Promise<Table[]> {
        const rows = await this.db.all<TableRow>(`${SELECT} WHERE restaurant_id = ? ORDER BY number ASC`, [restaurantId])
        return rows.map(r => this.mapToTable(r))
    }

    async findByNumber(restaurantId: string, number: number): Promise<Table | null> {
        const row = await this.db.get<TableRow>(`${SELECT} WHERE restaurant_id = ? AND number = ?`, [restaurantId, number])
        return row ? this.mapToTable(row) : null
    }

    async save(table: Table): Promise<void> {
        const existing = await this.findById(table.id)
        if (existing) {
            await this.db.run(
                'UPDATE tables SET number = ?, description = ?, capacity = ?, status = ? WHERE id = ?',
                [table.number, table.description, table.capacity, table.status, table.id]
            )
        } else {
            await this.db.run(
                'INSERT INTO tables (id, restaurant_id, number, description, capacity, status) VALUES (?, ?, ?, ?, ?, ?)',
                [table.id, table.restaurantId, table.number, table.description, table.capacity, table.status]
            )
        }
    }

    async delete(id: string): Promise<void> {
        await this.db.run('DELETE FROM tables WHERE id = ?', [id])
    }

    async occupyIfFree(restaurantId: string, id: string): Promise<boolean> {
        const result = await this.db.run(
            "UPDATE tables SET status = 'ocupada' WHERE id = ? AND restaurant_id = ? AND status = 'libre'",
            [id, restaurantId]
        )
        return result.changes > 0
    }

    private mapToTable(row: TableRow): Table {
        return {
            id: row.id,
            restaurantId: row.restaurantId,
            number: row.number,
            description: row.description,
            capacity: row.capacity,
            status: normalizeTableStatus(row.status)
        }
    }
}
