import { Hono } from "hono";
import { db } from "../db";

const dashboard = new Hono();
/**
 * view: /dashboard
 */

const ordersCollection = db.collection("orders");
const productsCollection = db.collection("products");
const consultantsCollection = db.collection("consultants");

dashboard.get("/dashboard", async (c) => {
  try {
    const salesAggregation = await ordersCollection
      .aggregate([{ $group: { _id: null, totalSales: { $sum: "$total" } } }])
      .toArray();

    const monthlySales =
      salesAggregation.length > 0 ? salesAggregation[0].totalSales : 0;

    const pendingOrders = await ordersCollection.countDocuments({
      status: "pending",
    });

    const lowStockProducts = await productsCollection.countDocuments({
      stock: { $lte: 5 },
    });

    const topConsultantsAgg = await ordersCollection
      .aggregate([
        { $group: { _id: "$consultantId", totalSales: { $sum: "$total" } } },
        { $sort: { totalSales: -1 } },
        { $limit: 5 },
      ])
      .toArray();

    const topConsultants = [];
    for (const tc of topConsultantsAgg) {
      if (tc._id) {
        const consultant = await consultantsCollection.findOne({ _id: tc._id });
        if (consultant) {
          topConsultants.push({
            id: consultant._id,
            name: consultant.name,
            totalSales: tc.totalSales,
          });
        }
      }
    }

    return c.json({
      monthlySales,
      pendingOrders,
      lowStockProducts,
      topConsultants,
    });
  } catch {
    return c.json(
      {
        ok: false,
        error: {
          code: "BAD_REQUEST",
          message: "bad request",
        },
      },
      400
    );
  }
});

export default dashboard;
