import { Hono } from "hono";
import { db } from "../db";

const dashboard = new Hono();
/**
 * view: /dashboard
 */

const ordersCollection = db.collection("orders");
const productsCollection = db.collection("products");
const consultantsCollection = db.collection("consultants");
const usersCollection = db.collection("users");

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

    const salesByCategory = await ordersCollection
      .aggregate([
        { $unwind: "$items" },
        {
          $lookup: {
            from: "products",
            localField: "items.productId",
            foreignField: "_id",
            as: "productDetails"
          }
        },
        { $unwind: "$productDetails" },
        {
          $group: {
            _id: "$productDetails.category",
            totalSales: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
          }
        }
      ])
      .toArray();

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
        let consultantName = null;
        
        const consultant = await consultantsCollection.findOne({ _id: tc._id });
        if (consultant) {
          consultantName = consultant.name;
        } else {
          const user = await usersCollection.findOne({ _id: tc._id });
          if (user) consultantName = user.username;
        }

        if (consultantName) {
          topConsultants.push({
            id: tc._id,
            name: consultantName,
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
      salesByCategory,
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
