import { Component, inject, OnInit, signal } from '@angular/core'
import { ActivatedRoute, Router, RouterLink } from '@angular/router'
import { HttpErrorResponse } from '@angular/common/http'
import { TableService } from '../../core/services/table.service'
import { TableStore } from '../../core/store/table.store'
import { Table } from '../../core/models/table.model'

@Component({
  selector: 'app-table-selection',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="container">
      <div class="page-header">
        <div>
          <a routerLink="/restaurants" class="back-link">← Volver a restaurantes</a>
          <h1>Elige tu mesa</h1>
        </div>
      </div>

      <div class="card people-card">
        <label for="people">Número de personas</label>
        <div class="people-row">
          <input id="people" type="number" min="1" step="1" [value]="people() ?? ''"
                 (input)="onPeopleInput($any($event.target).value)" />
          <button class="btn btn-primary" (click)="search()">Buscar mesas</button>
        </div>
        @if (peopleError()) {
          <p class="error-msg">{{ peopleError() }}</p>
        }
      </div>

      @if (warning()) {
        <div class="alert-error">{{ warning() }}</div>
      }

      @if (loading()) {
        <div class="spinner"></div>
      } @else if (searched()) {
        @if (tables().length === 0) {
          <div class="empty-state card">
            <p>No hay mesas disponibles para {{ people() }} personas</p>
          </div>
        } @else {
          <div class="tables-grid">
            @for (t of tables(); track t.id) {
              <button type="button" class="table-card card" [class.selected]="selected()?.id === t.id"
                      (click)="selected.set(t)">
                <strong>Mesa {{ t.number }}</strong>
                @if (t.description) { <span class="desc">{{ t.description }}</span> }
                <span class="cap">Capacidad: {{ t.capacity }}</span>
              </button>
            }
          </div>
          <button class="btn btn-primary continue" [disabled]="!selected() || submitting()" (click)="continue()">
            Continuar
          </button>
        }
      }
    </div>
  `,
  styles: [`
    .container { max-width: 900px; margin: 0 auto; }
    .back-link { font-size: 13px; color: var(--text-muted); margin-bottom: 8px; display: inline-block; }
    .people-card { padding: 20px; margin-bottom: 20px; }
    .people-row { display: flex; gap: 12px; margin-top: 8px; }
    .people-row input { max-width: 160px; }
    .error-msg { color: var(--red); margin-top: 8px; font-size: 13px; }
    .tables-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; margin-bottom: 20px; }
    .table-card { display: flex; flex-direction: column; gap: 4px; padding: 16px; text-align: left; cursor: pointer; }
    .table-card.selected { border-color: var(--green-medium); background: var(--green-glow); }
    .desc, .cap { color: var(--text-muted); font-size: 13px; }
    .continue { min-width: 160px; justify-content: center; }
  `]
})
export class TableSelectionComponent implements OnInit {
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  private readonly tableService = inject(TableService)
  private readonly tableStore = inject(TableStore)

  private restaurantId = ''
  readonly people = signal<number | null>(null)
  readonly peopleError = signal<string | null>(null)
  readonly tables = signal<Table[]>([])
  readonly selected = signal<Table | null>(null)
  readonly loading = signal(false)
  readonly searched = signal(false)
  readonly submitting = signal(false)
  readonly warning = signal<string | null>(null)

  ngOnInit(): void {
    this.restaurantId = this.route.snapshot.paramMap.get('id')!
  }

  onPeopleInput(value: string): void {
    const n = Number(value)
    this.people.set(value === '' || Number.isNaN(n) ? null : n)
  }

  search(): void {
    this.warning.set(null)
    this.load()
  }

  private load(): void {
    const n = this.people()
    if (n === null || !Number.isInteger(n) || n < 1) {
      this.peopleError.set('Indica un número entero de personas mayor o igual que 1')
      return
    }
    this.peopleError.set(null)
    this.loading.set(true)
    this.selected.set(null)
    this.tableService.getAvailable(this.restaurantId, n).subscribe({
      next: (tables) => {
        this.tables.set(tables)
        this.searched.set(true)
        this.loading.set(false)
      },
      error: (err) => {
        this.warning.set(this.messageOf(err, 'Error al cargar las mesas'))
        this.loading.set(false)
      }
    })
  }

  continue(): void {
    const table = this.selected()
    if (!table) return
    this.submitting.set(true)
    this.tableService.occupy(this.restaurantId, table.id).subscribe({
      next: (occupied) => {
        this.tableStore.select(this.restaurantId, occupied)
        this.submitting.set(false)
        this.router.navigate(['/restaurants', this.restaurantId])
      },
      error: (err) => {
        this.submitting.set(false)
        if (err instanceof HttpErrorResponse && err.status === 409) {
          this.warning.set(this.messageOf(err, 'La mesa ya no está disponible. Elige otra.'))
          this.load()
        } else {
          this.warning.set(this.messageOf(err, 'No se pudo ocupar la mesa'))
        }
      }
    })
  }

  private messageOf(err: unknown, fallback: string): string {
    return (err as HttpErrorResponse)?.error?.message || fallback
  }
}
