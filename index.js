require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

const uri = `mongodb+srv://${process.env.user_Name}:${process.env.pass_Db}@cluster0.jwnb6pt.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
      const result = await equipmentCollection.find().limit(6).toArray();
      res.send(result);
    });

    app.get('/equipments/email/:email', async (req, res) => {
      const email = req.params.email;
      const equipment = await equipmentCollection.find({ userEmail: email }).toArray();
      res.send(equipment);
    });

    app.get('/equipments/:id', async (req, res) => {
      const id = req.params.id;
      if (!ObjectId.isValid(id)) return res.send({});
      const equipment = await equipmentCollection.findOne({ _id: new ObjectId(id) });
      res.send(equipment || {});
    });

    app.post('/equipments', async (req, res) => {
      const result = await equipmentCollection.insertOne(req.body);
      res.send(result);
    });

    app.delete('/equipments/:id', async (req, res) => {
      const id = req.params.id;
      if (!ObjectId.isValid(id)) return res.send({});
      const result = await equipmentCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    app.put('/equipments/:id', async (req, res) => {
      const id = req.params.id;
      if (!ObjectId.isValid(id)) return res.send({});
      const updateDoc = {
        $set: {
          image: req.body.image,
          userEmail: req.body.userEmail,
          userName: req.body.userName,
          itemName: req.body.itemName,
          categoryName: req.body.categoryName,
          description: req.body.description,
          price: req.body.price,
          rating: req.body.rating,
          customization: req.body.customization,
          processingTime: req.body.processingTime,
          stockStatus: req.body.stockStatus
        }
      };
      const result = await equipmentCollection.updateOne(
        { _id: new ObjectId(id) },
        updateDoc
      );
      res.send(result);
    });

  } finally {
  
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Server is running');
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});