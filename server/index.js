const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const urlRoutes = require("./routes/url");
const bodyParser = require("body-parser");
const cors = require("cors");
const helmet = require("helmet");

dotenv.config();
const app = express();
const port = process.env.PORT || 3030;

app.use(cors({ origin: 'http://localhost:3000' }));

app.use(helmet());
app.use(express.json());
app.use(bodyParser.json({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));

app.options('*', cors());

app.use('/', urlRoutes);

app.listen(port, () => {
  console.log(`Server started on Port: ${port}`);
});

mongoose.connect(process.env.MONGO_URL)
  .then(() => {
    console.log('Connected to Database');
  })
  .catch((error) => {
    console.log(`Error connecting to Database: ${error}`);
  });
