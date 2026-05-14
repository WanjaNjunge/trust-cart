/**
 * Direct PostgreSQL query helper for data validation tests.
 *
 * Purpose: verify that API operations produce the correct database state —
 * audit trails, price snapshots, status history, referential integrity.
 * These are things the UI layer cannot directly observe.
 *
 * Pattern: Act via API → Assert via direct SQL query.
 */
import { Pool, type QueryResultRow } from 'pg';

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const connectionString =
      process.env.DATABASE_URL ||
      'postgresql://trustcart:trustcart_local@localhost:5432/trustcart_dev';
    pool = new Pool({ connectionString, max: 3 });
  }
  return pool;
}

export async function queryDb<T extends QueryResultRow = QueryResultRow>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const { rows } = await getPool().query<T>(sql, params);
  return rows;
}

export async function closeDb(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

// ─── Domain-specific query helpers ────────────────────────────────────────────

export async function getOrderByNumber(orderNumber: string) {
  return queryDb<{
    id: string;
    order_number: string;
    status: string;
    total: number;
    user_id: string | null;
  }>(`SELECT id, order_number, status, total, user_id FROM orders WHERE order_number = $1`, [
    orderNumber,
  ]);
}

export async function getOrderItems(orderNumber: string) {
  return queryDb<{
    product_name: string;
    product_sku: string;
    unit_price: number;
    quantity: number;
    line_total: number;
  }>(
    `SELECT oi.product_name, oi.product_sku, oi.unit_price, oi.quantity, oi.line_total
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     WHERE o.order_number = $1`,
    [orderNumber],
  );
}

export async function getOrderStatusHistory(orderNumber: string) {
  return queryDb<{
    from_status: string | null;
    to_status: string;
    changed_by_type: string;
    reason: string | null;
    created_at: Date;
  }>(
    `SELECT osh.from_status, osh.to_status, osh.changed_by_type, osh.reason, osh.created_at
     FROM order_status_history osh
     JOIN orders o ON o.id = osh.order_id
     WHERE o.order_number = $1
     ORDER BY osh.created_at ASC`,
    [orderNumber],
  );
}

export async function getOrderAddress(orderNumber: string) {
  return queryDb<{
    recipient_name: string;
    city: string;
    county: string;
  }>(
    `SELECT oa.recipient_name, oa.city, oa.county
     FROM order_addresses oa
     JOIN orders o ON o.id = oa.order_id
     WHERE o.order_number = $1`,
    [orderNumber],
  );
}

export async function getStockAdjustments(productSku: string) {
  return queryDb<{
    type: string;
    quantity: number;
    reason: string | null;
    reference_id: string | null;
    created_at: Date;
  }>(
    `SELECT sa.type, sa.quantity, sa.reason, sa.reference_id, sa.created_at
     FROM stock_adjustments sa
     JOIN products p ON p.id = sa.product_id
     WHERE p.sku = $1
     ORDER BY sa.created_at DESC`,
    [productSku],
  );
}

export async function getInventoryRecord(slug: string) {
  return queryDb<{
    quantity_on_hand: number;
    quantity_reserved: number;
    reorder_threshold: number;
  }>(
    `SELECT ir.quantity_on_hand, ir.quantity_reserved, ir.reorder_threshold
     FROM inventory_records ir
     JOIN products p ON p.id = ir.product_id
     WHERE p.slug = $1`,
    [slug],
  );
}

export async function getProductPrice(slug: string): Promise<number | null> {
  const rows = await queryDb<{ price: number }>(
    `SELECT price FROM products WHERE slug = $1`,
    [slug],
  );
  return rows[0]?.price ?? null;
}
