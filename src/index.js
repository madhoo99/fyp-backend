// For setup: npm install pg
// Install heroku for db access


const express = require('express')
const app = express()
const port = 8000


// Connecting to Heroku server
// ----------------------------

const { Pool, Client } = require("pg");

const credentials = {
  user: "hfmzrrdpbaplzk",
  host: "ec2-44-206-204-65.compute-1.amazonaws.com",
  database: "d10ror0sgbld5e",
  password: "609028af0da480bf9c1a6f6d2d8ad479821a0ed3fd5060a78720c060971f3e7b",
  port: 5432,
  ssl: {
    rejectUnauthorized: false
  }
};

// Connect with a connection pool.

async function poolDemo() {
  const pool = new Pool(credentials);
  const now = await pool.query("SELECT NOW()");
  await pool.end();

  return now;
}

// Connect with a client.

async function clientDemo() {
  const client = new Client(credentials);
  await client.connect();
  const now = await client.query("SELECT NOW()");
  await client.end();

  return now;
}

// CRUD functions

async function newUser(user, pool) {
  const text = `
    INSERT INTO A_USER (ID, NICKNAME, FULLNAME, AGE)
    VALUES ($1, $2, $3, $4)
    RETURNING id
    `;
  const values = [user.id, user.nickname, user.fullname, user.age];
  return pool.query(text, values);
}

async function getUser(userId, pool) {
  const text = `SELECT * FROM A_USER WHERE id = $1`;
  const values = [userId];
  return pool.query(text, values);
}


// We do not need updatePerson details yet ----

// async function updatePersonName(personId, fullname, pool) {
//   const text = `UPDATE people SET fullname = $2 WHERE id = $1`;
//   const values = [personId, fullname];
//   return pool.query(text, values);
// }

async function removeUser(userId, pool) {
  const text = `DELETE FROM people WHERE id = $1`;
  const values = [userId];
  return pool.query(text, values);
}


// Use a self-calling function so we can use async / await.

(async () => {
  const poolResult = await poolDemo();
  console.log("Time with pool: " + poolResult.rows[0]["now"]);

  const clientResult = await clientDemo();
  console.log("Time with client: " + clientResult.rows[0]["now"]);

  const pool = new Pool(credentials);

    // Register a new user and get an id, which comes from the RETURNING clause
  const registerResult = await newUser({
      id: "3",
      nickname: "Avenger",
      fullname: "John Doe",
      age: "30",
    }, pool);
    
    const userId = registerResult.rows[0]["id"];
    console.log("Registered a user with id: " + userId);
  
    await pool.end();
})();







// Link to Frontend 
// ---------
const cors = require('cors');

app.use(cors({
    origin: '*'
}));

var bodyParser = require('body-parser')
app.use(bodyParser.json())
//app.use(bodyParser.urlencoded({ extended: true }))

const fs = require('fs');

const ImageDataURI = require('image-data-uri');
const filePath = 'misc/data.png'

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.post('/save', (req, res) => {
  console.log(req.body)
  ImageDataURI.outputFile(req.body.image, filePath);
  res.send("all good")
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})