import type { TableRepository } from '@repositories/table.repository.js'
import type { Table } from '@models/table.model.js'

export class MockTableRepository implements TableRepository {
    private tables: Map<string, Table> = new Map()

    async findById(id: string): Promise<Table | null> {
        const t = this.tables.get(id)
        return t ? { ...t } : null
    }

    async findByRestaurantId(restaurantId: string): Promise<Table[]> {
        return Array.from(this.tables.values())
            .filter(t => t.restaurantId === restaurantId)
            .sort((a, b) => a.number - b.number)
            .map(t => ({ ...t }))
    }

    async findByNumber(restaurantId: string, number: number): Promise<Table | null> {
        const t = Array.from(this.tables.values()).find(t => t.restaurantId === restaurantId && t.number === number)
        return t ? { ...t } : null
    }

    async save(table: Table): Promise<void> {
        this.tables.set(table.id, { ...table })
    }

    async delete(id: string): Promise<void> {
        this.tables.delete(id)
    }

    async occupyIfFree(restaurantId: string, id: string): Promise<boolean> {
        const t = this.tables.get(id)
        if (!t || t.restaurantId !== restaurantId || t.status !== 'libre') return false
        t.status = 'ocupada'
        return true
    }
}
