const express = require('express')
const app = express()
const port = 8000

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