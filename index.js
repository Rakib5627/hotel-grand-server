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
      'http://localhost:5173',
      'https://hotel-website-2fba0.web.app' ,
      'https://hotel-website-2fba0.firebaseapp.com'
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


const verifyToken = (req, res, next) =>{
  const token = req?.cookies?.token;
  console.log('token in middleware', token);
  // if no token available ------------
  if(!token){
      return res.status(401).send({message: 'unauthorized access'})
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) =>{
      if(err){
          return res.status(401).send({message: 'unauthorized access'})
      }
      req.user = decoded;
      next();
  })
}





async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const database = client.db("hotel");
    const roomsCollection = database.collection("rooms");
    const bookingCollection = database.collection("booking");      
    const reviewCollection = database.collection("reviews");
    
      // auth api
    
    app.post('/jwt', logger , async (req, res) => {
      const user = req.body;
      console.log('user for token', user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });

      res.cookie('token', token, {
          httpOnly: true,
          secure: true,
          sameSite: 'none'
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

app.get('/bookings', logger, verifyToken , async (req, res) => {
    console.log('query email lllllll' , req.query.email);
    console.log('token owner info', req.user)
    if(req.user.email !== req.query.email){
        return res.status(403).send({message: 'forbidden access'})
    }
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

app.patch('/bookings/:id', async (req, res) => {
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) };
  const updatedBooking = req.body;
  console.log(updatedBooking);
  const updateDoc = {
      $set: {
          date: updatedBooking.date
      },
  };
  const result = await bookingCollection.updateOne(filter, updateDoc);
  res.send(result);
})


app.delete('/bookings/:id', async (req, res) => {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) }
    const result = await bookingCollection.deleteOne(query);
    res.send(result);
})


// ---------------review--------------------------

app.get('/reviews', async(req , res) => {
  const cursor = reviewCollection.find();
  const result = await cursor.toArray();
  res.send(result);
})

app.get('/reviews/:title', async(req , res) => {
  const title = req.params.title;   
  const cursor = reviewCollection.find({ title });
  const result = await cursor.toArray();
  res.send(result);
})


app.post('/reviews', async (req, res) => {
  const review = req.body;
  console.log(review);
  const result = await reviewCollection.insertOne(review);
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