require("dotenv").config();
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const streamifier = require("streamifier");
const stripe = require("stripe")(
 `${process.env.Stripe_Secret_key}`
);
const jwt = require("jsonwebtoken");
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());


// >>>>>Auth Releted Apies<<<<<
app.post("/jwt", async (req, res) => {
  const user = req.body;
  console.log(user, "is trying ");
  // creating token
  const token = jwt.sign(user, process.env.Token_Secret, {
    expiresIn: "1h",
  });
  res.send({ token });
});
// verify token middleware
const veryifyToken = (req, res, next) => {
  const authorization = req.headers.authorization;
  console.log(authorization);
  if (!authorization) {
    return res.status(401).send({ error: true, message: "unothorized access" });
  }
  const token = authorization.split(" ")[1];
  jwt.verify(token, process.env.Token_Secret, (err, decoded) => {
    if (err) {
      return res.status(401).send({ error: true, message: "forbiden acces" });
    }
    req.decoded = decoded;
    next();
  });
};   

// verify Admin midleware
const verifyAdmin= async(req,res,next)=>{
  const email=req.decoded.email;
  const query={email:email} ;
  const user=await usersCollection.findOne(query);
  if(user?.role!=="admin"){
    return res.status(403)
    .send({error:true,message:"Forbiden Access"})
  }
  next()
}


// >>>>Payment Intent<<<<<<<<
app.post("/creat-payment-intent", async (req, res) => {
  const { price } = req.body;
  const amount = parseInt(price * 100);
 
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount,
    currency: "usd",
    payment_method_types: ["card"],
  });
  res.send({
    clientSecret: paymentIntent.client_secret,
  });
});

// >>>>Cloudinary Db Url and config:<<<<<

const upload = multer({
  storage: multer.memoryStorage(),
});

const uploadToCloudinary = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    );

    streamifier.createReadStream(buffer).pipe(stream);
  });
};


CLOUDINARY_URL = `cloudinary://${process.env.Api_Key}:${process.env.Api_Secret_Key}@${process.env.Cloud_Name}`;

cloudinary.config({
  cloud_name: `${process.env.Cloud_Name}`,
  api_key: `${process.env.Api_Key}`,
  api_secret: `${process.env.Api_Secret_Key}`,
});

const uri =
  `mongodb+srv://${process.env.Db_User}:${process.env.DB_Pass}@cluster0.jwnb6pt.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const equipmentCollection = client
      .db("equipmentDB")
      .collection("equipments");
    const cartsCollection = client.db("equipmentDB").collection("carts");
    const usersCollection = client.db("equipmentDB").collection("users");
    const paymentCollection = client.db("equipmentDB").collection("payments");
    const wishlistCollection = client.db("equipmentDB").collection("wishlist");

    app.get("/equipments", async (req, res) => {
      const result = await equipmentCollection.find().toArray();
      res.send(result);
    });

    app.get("/equipments/email/:email", veryifyToken, async (req, res) => {
      const email = req.params.email;
      const equipment = await equipmentCollection
        .find({ userEmail: email })
        .toArray();
      res.send(equipment);
    });

    app.get("/equipments/:id", async (req, res) => {
      const id = req.params.id;
      const quary = { _id: new ObjectId(id) };
      const equipment = await equipmentCollection.findOne(quary);
      console.log(equipment);
      res.send(equipment);
    });

    // app.post('/equipments', async (req, res) => {
    //   const result = await equipmentCollection.insertOne(req.body);
    //   res.send(result);
    // });
    app.post("/equipments", upload.single("image"), async (req, res) => {
      try {
        // Upload image
        const result = await uploadToCloudinary(
          req.file.buffer,
          "gearNest/equipments",
        );

        // Product object
        const newEquipment = {
          ...req.body,
          image: result.secure_url,
          publicId: result.public_id,
          price: parseFloat(req.body.price),
          rating: parseFloat(req.body.rating),
          stockStatus: parseInt(req.body.stockStatus),
        };

        // Save to MongoDB
        const dbResult = await equipmentCollection.insertOne(newEquipment);

        res.send(dbResult);
      } catch (error) {
        console.log(error);

        res.status(500).send({
          message: error.message,
        });
      }
    });

    app.post("/users", upload.single("image"), async (req, res) => {
      const user = req.body;
      const exist = await usersCollection.findOne({ email: user.email });
      if (exist) {
        return res.send({ message: "User already exists" });
      }

      let image = "";
      let publicId = "";
      if (req.file) {
        const profile = await uploadToCloudinary(
          req.file.buffer,
          "gearNest/profilePhoto",
        );
        image = profile.secure_url;
        publicId = profile.public_id;
      } else {
        image = user.image;
      }
      const newUser = {
        ...req.body,
        image: image,
        publicId: publicId,
        date: new Date(),
        role: "user",
      };
      const result = await usersCollection.insertOne(newUser);
      res.send(result);
    });

    app.post("/carts", veryifyToken, async (req, res) => {
      const { productId } = req.body;
      const email = req.decoded.email;
      const quary = { _id: new ObjectId(productId) };
      const item = await equipmentCollection.findOne(quary);
      const cartItem = {
        userEmail: email,
        itemName: item.itemName,
        image: item.image,
        price: item.price,
        quantity: 1,
      };

      const result = await cartsCollection.insertOne(cartItem);
      res.send(result);
    });

    app.post('/wishlist', veryifyToken, async (req, res) => {
      const { productId } = req.body;
      const email = req.decoded.email;
      const quary = { _id: new ObjectId(productId) };
      const item = await equipmentCollection.findOne(quary);
      const wishlistItem = {
        userEmail: email,
        itemName: item.itemName,
        image: item.image,
        price: item.price,
        quantity: 1,
      };
      const result = await wishlistCollection.insertOne(wishlistItem);
      res.send(result);
    });

   app.post('/payment',async(req,res)=>{
        const payment=req.body;
        const {cartIds}=payment;
        const id =cartIds.map(id => new ObjectId(id))
        const result=await paymentCollection.insertOne(payment);
        const deleteResult=await cartsCollection.deleteMany({_id:{$in:id}})
        res.send({result,deleteResult})

      })   

    app.patch("/carts/:id", async (req, res) => {
      const id = req.params.id;
      const quary = { _id: new ObjectId(id) };
      const { quantity } = req.body;
      const data = {
        $set: {
          quantity: quantity,
        },
      };
      const result = await cartsCollection.updateOne(quary, data);
      res.send(result);
    });

    app.get("/cart/:email", async (req, res) => {
      const email = req.params.email;
      const query = {
        userEmail: email,
      };
      const result = await cartsCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/wishlist/:email", async (req, res) => {
      const email = req.params.email;
      const query = {
        userEmail: email,
      };
      const result = await wishlistCollection.find(query).toArray();
      res.send(result);
    });

    app.delete("/equipments/:id", async (req, res) => {
      const id = req.params.id;
      if (!ObjectId.isValid(id)) return res.send({});
      const quary = { _id: new ObjectId(id) };
      const equipment = await equipmentCollection.findOne(quary);
      await cloudinary.uploader.destroy(equipment.publicId);
      const result = await equipmentCollection.deleteOne(quary);
      res.send(result);
    });

    app.delete("/carts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await cartsCollection.deleteOne(query);
      res.send(result);
    });

    app.put("/equipments/:id", async (req, res) => {
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
          stockStatus: req.body.stockStatus,
        },
      };
      const result = await equipmentCollection.updateOne(
        { _id: new ObjectId(id) },
        updateDoc,
      );
      res.send(result);
    });
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
