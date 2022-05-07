const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const verify = require('jsonwebtoken/verify');
const port = process.env.PORT || 5000;
const app = express();

app.use(cors());
app.use(express.json());

function verifyJwt(req, res, next) {
    const authHeader = req.headers.authorization

    if (!authHeader) {
        return res.status(401).send({ message: 'Unauthorized Access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
        if (error) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        console.log('decoded', decoded);
        req.decoded = decoded;
        next();
    })

}



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.t4gg3.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const itemCollection = client.db('warehouse').collection('item');


        //auth api
        app.post('/login', async (req, res) => {
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '60d'
            });
            res.send({ accessToken });
        })


        //to load all data
        app.get('/itemAll', async (req, res) => {
            // const email = req.query.email;
            // console.log(email);
            const query = {};
            const cursor = itemCollection.find(query);
            const items = await cursor.toArray();
            res.send(items);
        });
        //to load data for logged user
        app.get('/item', verifyJwt, async (req, res) => {
            const decodedEmail = req.decoded.email
            const email = req.query.email;
            console.log(email);
            if (email === decodedEmail) {
                const query = { email: email };
                const cursor = itemCollection.find(query);
                const items = await cursor.toArray();
                res.send(items);
            }
            else {
                return res.status(403).send({ message: 'forbidden access' })
            }
        });

        //to load a data with id
        app.get('/item/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const item = await itemCollection.findOne(query);
            res.send(item);
        });


        app.put('/item/:id', async (req, res) => {
            const id = req.params.id;
            const property = req.body;
            const query = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    quantity: property.newQuantity
                }
            }
            const result = await itemCollection.updateOne(query, updateDoc, options);
            res.send(result)

        })


        //upload new data
        app.post('/item', async (req, res) => {
            const newItem = req.body;
            const result = await itemCollection.insertOne(newItem);
            res.send(result);
        })
        //delete a data
        app.delete('/item/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await itemCollection.deleteOne(query);
            res.send(result);
        });
    }
    finally {

    }
}
run().catch(console.dir)



app.get('/', (req, res) => {
    res.send('Warehouse Management');
})
app.listen(port, () => {
    console.log("listening from", port);
})
// DB_USER = warehouse
// DB_PASS = MwiN1XoRzHvEWcvv