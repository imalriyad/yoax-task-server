const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
require("dotenv").config();

// Middleware
app.use(cors());
app.use(express.json());

// Conntecting to mongodb
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mp2awoi.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

    const db = client.db("yoxaxTaskDb");
    const orderCollection = db.collection("order");

    // api for creating new order
    app.post("/api/v1/create-new-order", async (req, res) => {
      const newOrder = req.body;
      const result = await orderCollection.insertOne(newOrder);
      res.send(result);
    });

    //   Api for getting all order
    app.get("/api/v1/get-all-order", async (req, res) => {
      const result = await orderCollection.find().toArray();
      res.send(result);
    });

    // Api for searching order
    app.get("/api/v1/get-order", (req, res) => {
      const query = req.query?.searchInput;
    });

    //   api for changing status
    app.put("/api/v1/status", async (req, res) => {
      const { selectedOrderId } = req.body;
      const query = { orderID: selectedOrderId };
      console.log(selectedOrderId);
      const updateDoc = {
        $set: {
          status: "dispatched",
        },
      };
      const result = await orderCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    // Api for update order
    app.patch("/api/v1/update-order", async (req, res) => {
      const updatedOrder = req.body;

      // Construct the $set object dynamically
      const updateDoc = {
        $set: {},
      };

      // Check if each field in updatedOrder exists and add it to the $set object
      if (updatedOrder.name) {
        updateDoc.$set.name = updatedOrder.name;
      }

      if (updatedOrder.email) {
        updateDoc.$set.email = updatedOrder.email;
      }

      if (updatedOrder.shipping) {
        updateDoc.$set.shipping = updatedOrder.shipping;
      }
      const query = { orderID: updatedOrder.orderId };
      const result = await orderCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    //   Searching order
    app.get("/api/v1/orders", async (req, res) => {
      const { query, orderType, status } = req.query;
      try {
        // Build filter based on query parameters
        let filter = {};

        if (query) {
          const caseInsensitiveQuery = new RegExp(query, "i");
          filter.$or = [
            { name: caseInsensitiveQuery },
            { email: caseInsensitiveQuery },
            { country: caseInsensitiveQuery },
            { shipping: caseInsensitiveQuery },
            { source: caseInsensitiveQuery },
            { orderType: caseInsensitiveQuery },
          ];
        }

        if (orderType) {
          filter.orderType = orderType.toLowerCase(); // Assuming orderType is passed as a query parameter
        }
        if (status) {
          filter.status = status.toLowerCase(); // Assuming status is passed as a query parameter
        }

        console.log(filter);
        // Find orders based on the filter
        const filteredOrders = await orderCollection.find(filter).toArray();
        res.send(filteredOrders);
      } catch (error) {
        console.error("Error retrieving orders:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

    // api for pagination
    app.get("/api/v1/total-order", async (req, res) => {
      const totalOrder = await orderCollection.estimatedDocumentCount();
      res.send({ totalOrder });
    });

    // paginations
    app.get("/api/v1/order", async (req, res) => {
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      const skip = page * size;
      const result = await orderCollection
        .find()
        .skip(skip)
        .limit(size)
        .toArray();
      res.send(result);
    });

    //   Api for delteing order
    app.delete("/api/v1/delete-order", async (req, res) => {
      const { orderID } = req.body;
      console.log(orderID);
      const query = { orderID: orderID };
      const result = await orderCollection.deleteMany(query);
      res.send(result);
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("yoxaz-task-server runining. . .");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
