import { Hono } from "hono";

const dashboard = new Hono();
/**
 * view: /dashboard
 */

dashboard.get("/dashboard", (c) => {
  /*
    - KPIs
    - ventas
    - pedidos
    - stock crítico
  */

  return c.json({
    monthlySales: 120000,
    pendingOrders: 42,
    lowStockProducts: 7,
    topConsultants: [],
  });
});

export default dashboard;
