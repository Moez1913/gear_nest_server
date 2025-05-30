require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

// ✅ CORS Setup
const allowedOrigins = [
  'https://gearnest-45ca6.web.app', // Your Firebase hosting domain
  'http://localhost:5173',          // Local dev
  'https://gear-nest-server.vercel.app' // Optional: your server origin itself
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed from this origin'));
    }
  },
  credentials: true
}));

// Middleware
app.use(express.json());

// MongoDB URI
const uri = `mongodb+srv://${process.env.user_Name}:${process.env.pass_Db}@cluster0.jwnb6pt.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// MongoDB client
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    const equipmentCollection = client.db("equipmentDB").collection("equipments");

    app.get('/equipments', async (req, res) => {
      const result = await equipmentCollection.find().toArray();
      res.send(result);
    });

    app.get('/equipments/email/:email', async (req, res) => {
      const email = req.params.email;
      const equipment = await equipmentCollection.find({ userEmail: email }).toArray();
      equipment ? res.send(equipment) : res.status(404).send({ message: "Not found" });
    });

    app.get('/equipments/:id', async (req, res) => {
      const id = req.params.id;
      const equipment = await equipmentCollection.findOne({ _id: new ObjectId(id) });
      res.send(equipment);
    });

    app.post('/equipments', async (req, res) => {
      const newItem = req.body;
      const result = await equipmentCollection.insertOne(newItem);
      res.send(result);
    });

    app.delete('/equipments/:id', async (req, res) => {
      const id = req.params.id;
      const result = await equipmentCollection.deleteOne({ _id: new ObjectId(id) });
      result.deletedCount === 1
        ? res.send({ message: "Deleted" })
        : res.status(404).send({ message: "Not found" });
    });

    app.put('/equipments/:id', async (req, res) => {
      const id = req.params.id;
      const updatedEquipment = req.body;
      const result = await equipmentCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            image: updatedEquipment.image,
            userEmail: updatedEquipment.userEmail,
            userName: updatedEquipment.userName,
            itemName: updatedEquipment.itemName,
            categoryName: updatedEquipment.categoryName,
            description: updatedEquipment.description,
            price: updatedEquipment.price,
            rating: updatedEquipment.rating,
            customization: updatedEquipment.customization,
            processingTime: updatedEquipment.processingTime,
            stockStatus: updatedEquipment.stockStatus
          }
        },
        { upsert: true }
      );
      res.send(result);
    });

  } finally {
    // await client.close(); // Optional
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Server is running...');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
