import express from 'express';
import { config } from 'dotenv';
import { MongoClient, ServerApiVersion, ObjectId } from 'mongodb';
import bodyParser from 'body-parser';
import cors from 'cors';

config();
const uri = "mongodb+srv://alexprof:bOTUco0mjpkXV9v8@cluster0.e0yl2i0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const port = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post('/newrestaurant', async (req, res) => {
  try {
    const { id, name, image_URL, location, tags, rating, reviews } = req.body;

    const db = client.db("restaurants");
    const usersCollection = db.collection("restaurants");
    const existingRest = await usersCollection.findOne({ $or: [{ id }, { name }] });

    if (existingRest) {
      return res.status(400).send('A restaurant with the same ID or name already exists');
    }

    const result = await usersCollection.insertOne({ id, name, image_URL, location, tags, rating, reviews });
    res.status(201).send(`Restaurant created with id: ${result.insertedId}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error creating restaurant');
  }
});

app.get('/restaurants', async (req, res) => {
  try {
    const db = client.db("restaurants");
    const usersCollection = db.collection("restaurants");
    const restaurants = await usersCollection.find({}).toArray();
    res.status(200).send(restaurants);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching restaurants');
  }
});

app.get('/restaurants/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = client.db("restaurants");
    const usersCollection = db.collection("restaurants");
    const restaurant = await usersCollection.findOne({ id });

    if (!restaurant) {
      return res.status(404).send('Restaurant not found');
    }

    res.status(200).send(restaurant);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching restaurant');
  }
})

app.get('/tags', async (req, res) => {
  try {
    const db = client.db("restaurants");
    const usersCollection = db.collection("restaurants");
    const restaurants = await usersCollection.find({}).toArray();

    // Create a map of tags to arrays of restaurants
    const tagMap = new Map();
    for (const restaurant of restaurants) {
      for (const tag of restaurant.tags) {
        if (!tagMap.has(tag)) {
          tagMap.set(tag, []);
        }
        tagMap.get(tag).push(restaurant);
      }
    }

    // Convert the map to an array of tag objects
    const tags = Array.from(tagMap.entries()).map(([tag, restaurants]) => ({ tag, restaurants }));

    // Sort the tags by the number of restaurants in each tag
    tags.sort((a, b) => b.restaurants.length - a.restaurants.length);

    res.status(200).send(tags);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching tags');
  }
})

app.get('/tags/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = client.db("restaurants");
    const usersCollection = db.collection("restaurants");
    const restaurants = await usersCollection.find({ tags: id }).toArray();

    if (restaurants.length === 0) {
      return res.status(404).send('Tag not found');
    }

    res.status(200).send(restaurants);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching restaurants with tag');
  }
})

app.get('/cities', async (req, res) => {
  try {
    const db = client.db("restaurants");
    const usersCollection = db.collection("restaurants");
    const restaurants = await usersCollection.find({}).toArray();

    // Create a map of cities to arrays of restaurants
    const cityMap = new Map();
    for (const restaurant of restaurants) {
      const city = restaurant.address && restaurant.address.city;
      if (!cityMap.has(city)) {
        cityMap.set(city, []);
      }
      cityMap.get(city).push(restaurant);
    }

    // Convert the map to an array of city objects
    const cities = Array.from(cityMap.entries()).map(([city, restaurants]) => ({ city, restaurants }));

    // Sort the cities by the number of restaurants in each city
    cities.sort((a, b) => b.restaurants.length - a.restaurants.length);

    res.status(200).send(cities);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching cities');
  }
})

app.get('/', (req, res) => {
  res.send('Welcome to the Yelp API!')
})

app.listen(port, async () => {
  console.log(`Example app listening on port ${port}`)
  try {
    await client.connect();
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } catch (err) {
    console.error(err);
  }
});