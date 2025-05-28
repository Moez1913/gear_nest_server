const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;


// Middleware
app.use(express.json());
app.use(cors());






const uri = `mongodb+srv://${process.env.user_Name}:${process.env.pass_Db}@cluster0.jwnb6pt.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const equipmentCollection = client.db("equipmentDB").collection("equipments");
    // get all equipments
    app.get('/equipments', async (req, res) => {
      const cursor = equipmentCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

   app.get('/equipments/email/:email', async (req, res) => {
  const email = req.params.email;
  const query = { userEmail: email };
  const equipment = await equipmentCollection.find(query).toArray();
  if (equipment && equipment.length > 0) {
    res.send(equipment);
  } else {
    res.status(404).send({ message: "Equipment not found" });
  }
});

    app.get('/equipments/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      const equipment = await equipmentCollection.findOne(query);
      res.send(equipment);

    });
    // get equipment by id






    app.post('/equipments', async (req, res) => {
      const newEquipmet = req.body;
      const result = await equipmentCollection.insertOne(newEquipmet);
      res.send(result);

    })





    //   get equipmet by id


    app.delete('/equipments/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await equipmentCollection.deleteOne(query);
      if (result.deletedCount === 1) {
        res.send({ message: "Equipment deleted successfully" });
      } else {
        res.status(404).send({ message: "Equipment not found" });
      }
    })

    app.put('/equipments/:id', async (req, res) => {
  const id = req.params.id;
  if (!ObjectId.isValid(id)) {
    return res.status(400).send({ message: "Invalid ID format" });
  }
  const filter = { _id: new ObjectId(id) };
  const options = { upsert: false };
  const updatedEquipment = req.body;
  const updateDoc = {
    $set: {
      name: updatedEquipment.name,
      price: updatedEquipment.price,
      image: updatedEquipment.image,
      description: updatedEquipment.description,
      quantity: updatedEquipment.quantity,
      itemName: updatedEquipment.itemName,
      categoryName: updatedEquipment.categoryName,
      rating: updatedEquipment.rating,
      customization: updatedEquipment.customization,
      processingTime: updatedEquipment.processingTime,
      stockStatus: updatedEquipment.stockStatus,
      userEmail: updatedEquipment.userEmail,
      userName: updatedEquipment.userName
    }
  };
  const result = await equipmentCollection.updateOne(filter, updateDoc, options);
  res.send(result);
});


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);








app.get('/', (req, res) => {
  res.send('server is rinning')
})

app.listen(port, () => {
  console.log(`serve is running on prot:${port} `)
})