import { Component, inject, OnInit, computed } from '@angular/core';
import { AuthStore } from '@resttek/web-shared';
import { OrderStore } from '../../../orders/store/order.store';
import { TableStore } from '../../store/table.store';
import { TABLE_STATUSES, Table, TableStatus } from '../../models/table.model';

@Component({
  selector: 'app-mesas',
  standalone: true,
  templateUrl: './mesas.component.html',
  styleUrl: './mesas.component.css'
})
export class MesasComponent implements OnInit {
  private readonly authStore = inject(AuthStore);
  readonly tableStore = inject(TableStore);
  readonly orderStore = inject(OrderStore);

  readonly statuses = TABLE_STATUSES;

  readonly ordersByTable = computed(() => {
    const map = new Map<string, ReturnType<OrderStore['orders']>>();
    for (const order of this.orderStore.orders()) {
      if (!order.tableId) continue;
      map.set(order.tableId, [...(map.get(order.tableId) ?? []), order]);
    }
    return map;
  });

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    const restaurantId = this.authStore.user()?.restaurantId;
    if (!restaurantId) return;
    this.tableStore.load(restaurantId);
    this.orderStore.loadOrders(restaurantId);
  }

  ordersOf(table: Table) {
    return this.ordersByTable().get(table.id) ?? [];
  }

  onStatusChange(table: Table, event: Event): void {
    const restaurantId = this.authStore.user()?.restaurantId;
    if (!restaurantId) return;
    const status = (event.target as HTMLSelectElement).value as TableStatus;
    this.tableStore.changeStatus(restaurantId, table.id, status);
  }

  getStatusClass(status: string): string {
    return `badge badge-${status}`;
  }
}
