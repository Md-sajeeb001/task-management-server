require("dotenv").config();
const express = require("express");
const cors = require("cors");
const port = process.env.PORT || 9000;
const jwt = require("jsonwebtoken");
const app = express();
// const http = require("http");
// const server = http.createServer(app);

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { Server } = require("socket.io");
// const io = new Server(server, {
//   cors: {
//     origin: "*",
//   },
// });
const corsOptions = {
  origin: [
    "https://task-management-b0fbe.web.app",
    // "http://localhost:4173",
    // "http://localhost:4174",
    "http://localhost:5173",
  ],
  methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_NAME}:${process.env.DB_PASS}@cluster0.e4qpy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// WebSocket Connection
// io.on("connection", (socket) => {
//   console.log("A user connected");

//   socket.on("disconnect", () => {
//     console.log("User disconnected");
//   });
// });

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
    const userCollection = client
      .db("Task-Management-System")
      .collection("users");
    const taskCollection = client
      .db("Task-Management-System")
      .collection("tasks");

    // jwt related api
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "24h",
      });
      res.send({ token });
    });

    // post users information related api
    app.post("/users", async (req, res) => {
      const user = req.body;
      // insert email if user doesnt exists:
      // you can do this many ways (1. email unique, 2. upsert 3. simple checking)
      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "user already exists", insertedId: null });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    // get users information related api
    app.get("/users", async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    // task saved in database
    app.post("/tasks", async (req, res) => {
      const task = req.body;
      const result = taskCollection.insertOne(task);

      // Emit real-time update
      // io.emit("taskUpdated", { action: "add", task });
      res.send(result);
    });

    // get data by useremail
    app.get("/tasks/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const result = await taskCollection.find(query).toArray();
      res.send(result);
    });

    // delete data form db
    app.delete("/tasks/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await taskCollection.deleteOne(query);
      res.send(result);
    });

    // Update task by ID (including category)
    app.put("/tasks/:id", async (req, res) => {
      const id = req.params.id;
      const updatedTask = req.body;

      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          title: updatedTask.title,
          des: updatedTask.des,
          category: updatedTask.category, // Include category in update
        },
      };

      const result = await taskCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    // app.get("/tasks/:email", async (req, res) => {
    //   const email = req.params.email;

    //   // Check if the user exists
    //   const userExists = await userCollection.findOne({ email: email });

    //   if (!userExists) {
    //     return res.send({ message: "User not found", tasks: [] });
    //   }

    //   // Fetch tasks if the user exists
    //   const tasks = await taskCollection.find({ email: email }).toArray();
    //   res.send(tasks);
    // });

    // app.put("/tasks/:id", async (res, res) => {});

    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", async (req, res) => {
  res.send("task management system in running");
});

app.listen(port, () => {
  console.log(`server running on port ${port}`);
});
