import type { Request, Response, NextFunction } from 'express'
import type { TableService } from '@services/table.service.js'

export class TableController {
    constructor(private readonly tableService: TableService) {}

    create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const table = await this.tableService.create(req.params.restaurantId as string, this.toDTO(req.body))
            res.status(201).json(table)
        } catch (error) {
            next(error)
        }
    }

    getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            res.status(200).json(await this.tableService.findAll(req.params.restaurantId as string))
        } catch (error) {
            next(error)
        }
    }

    getAvailable = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const tables = await this.tableService.findAvailable(req.params.restaurantId as string, req.query.people)
            res.status(200).json(tables)
        } catch (error) {
            next(error)
        }
    }

    getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            res.status(200).json(await this.tableService.findById(req.params.restaurantId as string, req.params.id as string))
        } catch (error) {
            next(error)
        }
    }

    update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const table = await this.tableService.update(
                req.params.restaurantId as string, req.params.id as string, this.toDTO(req.body)
            )
            res.status(200).json(table)
        } catch (error) {
            next(error)
        }
    }

    delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            await this.tableService.delete(req.params.restaurantId as string, req.params.id as string)
            res.status(204).send()
        } catch (error) {
            next(error)
        }
    }

    changeStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const table = await this.tableService.changeStatus(
                req.params.restaurantId as string, req.params.id as string, req.body?.status
            )
            res.status(200).json(table)
        } catch (error) {
            next(error)
        }
    }

    occupy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const table = await this.tableService.occupy(req.params.restaurantId as string, req.params.id as string)
            res.status(200).json(table)
        } catch (error) {
            next(error)
        }
    }

    private toDTO(body: any) {
        return {
            number: body?.number,
            description: body?.description,
            capacity: body?.capacity,
            status: body?.status
        }
    }
}
