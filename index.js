const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app =express();
const port = process.env.PORT || 5000 ;

// middlewares

app.use(cors({
  origin: [
      'http://localhost:5173'
  ],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.y5comcm.mongodb.net/?retryWrites=true&w=majority`;



// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


// middleWares2

const logger = (req, res, next) =>{
  console.log('logger: info', req.method, req.url);
  next();
}




async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const database = client.db("hotel");
    const roomsCollection = database.collection("rooms");
    // const userCollection = database.collection("user");
    const bookingCollection = database.collection("booking");      
    
      // auth api
    
    app.post('/jwt', logger , async (req, res) => {
      const user = req.body;
      console.log('user for token', user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });

      res.cookie('token', token, {
          httpOnly: true,
          secure: true,
      })
          .send({ success: true });
  })

  app.post('/logout', async (req, res) => {
      const user = req.body;
      console.log('logging out', user);
      res.clearCookie('token', { maxAge: 0 }).send({ success: true })
  })


    // ------rooms api-------

    app.get('/rooms', async(req , res) => {
        const cursor = roomsCollection.find();
        const result = await cursor.toArray();
        res.send(result);
    })

    app.get('/rooms/:id', async(req , res) => {
        const id = req.params.id;  
        // console.log(id) 
        const query = {_id : new ObjectId(id)};
        const result = await roomsCollection.findOne(query);
        res.send(result);
    })


    



// --------booking rooms-----------

app.get('/bookings', logger, async (req, res) => {
    console.log(req.query.email);
    console.log('token owner info', req.user)

    let query = {};
    if (req.query?.email) {
        query = { email: req.query.email }
    }
    const result = await bookingCollection.find(query).toArray();
    res.send(result);
})

app.post('/bookings', async (req, res) => {
    const booking = req.body;
    console.log(booking);
    const result = await bookingCollection.insertOne(booking);
    res.send(result);
});








    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);








app.get('/' , (req , res) =>{
    res.send('server running');
})

app.listen(port , () => {
    console.log(`server running on port : ${port}`);
})