const accessKey = process.env.ACCESS_KEY
const secretKey = process.env.SECRET_KEY
const express = require('express')
const axios = require('axios')
const cors = require('cors')
const app = express()
const port = 3000
const AWS = require("aws-sdk");
const fs = require("fs");
const filePath = "./moviedata.json";
const bucketName = "csu44000assignment220";
const key = "moviedata.json";

AWS.config.update({
  region: "eu-west-1",
  accessKeyId: accessKey,
  secretAccessKey: secretKey
});

let dynamodb = new AWS.DynamoDB();
let s3 = new AWS.S3({apiVersion: '2006-03-01'});

async function downloadFile(filePath, bucketName, key) {
  let bucketParams = {
    Bucket: bucketName,
    Key: key
  };

  s3.getObject(bucketParams, (err, data) => {
    if (err) { 
      console.error(err);
    } else {
      fs.writeFileSync(filePath, data.Body.toString());
      console.log(`${filePath} has been created!`);
      setTimeout(uploadMovies, 3000);
    }
  });
};

const createNewTable = () => {
  AWS.config.update({
    endpoint: "https://dynamodb.eu-west-1.amazonaws.com"
  });
  let tableParams = {
      TableName : "Movies",
      KeySchema: [       
          { AttributeName: "year", KeyType: "HASH"},
          { AttributeName: "title", KeyType: "RANGE" }
      ],
      AttributeDefinitions: [       
          { AttributeName: "year", AttributeType: "N" },
          { AttributeName: "title", AttributeType: "S" }
      ],
      ProvisionedThroughput: {       
          ReadCapacityUnits: 1, 
          WriteCapacityUnits: 1
      }
  };

  dynamodb.createTable(tableParams, function(err, data) {
      if (err) {
          console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
          downloadFile(filePath, bucketName, key);
      } else {
          console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2));
          downloadFile(filePath, bucketName, key);
      }
  });
};

const uploadMovies = () => {
  let docClient = new AWS.DynamoDB.DocumentClient();

  console.log("Importing movies into DynamoDB. Please wait.");


  let allMovies = JSON.parse(fs.readFileSync('moviedata.json', 'utf8'));
  allMovies.forEach(function(movie) {
      var params = {
          TableName: "Movies",
          Item: {
              "year":  movie.year,
              "title": movie.title,
              "rating":  movie.info.rating
          }
      };

      docClient.put(params, function(err, data) {
         if (err) {
             console.error("Unable to add movie", movie.title, ". Error JSON:", JSON.stringify(err, null, 2));
         } else {
             console.log("PutItem succeeded:", movie.title);
         }
      });
  });
};

const destroyTable = () => {
  var params = {
    TableName : "Movies"
  };

  dynamodb.deleteTable(params, function(err, data) {
      if (err) {
          console.error("Unable to delete table. Error JSON:", JSON.stringify(err, null, 2));
      } else {
          console.log("Deleted table. Table description JSON:", JSON.stringify(data, null, 2));
      }
  });
}

const queryTable = (req, res) => {
  let year = Number(req.params.year);
  let name = req.params.name;
  let rating = Number(req.params.rating);
  let docClient = new AWS.DynamoDB.DocumentClient();
  console.log(`Querying for movies from ${year} starting with ${name} rated ${rating}+`);

  var params = {
      TableName : "Movies",
      ProjectionExpression: "#yr, title, rating",
      FilterExpression: "#yr = :yyyy AND begins_with(#tl, :nm) AND #rt > :rt",
      ExpressionAttributeNames:{
          "#yr": "year",
          "#tl": "title",
          "#rt": "rating"
      },
      ExpressionAttributeValues: {
          ":yyyy": year,
          ":nm": name,
          ":rt": rating
      }
  };

  docClient.scan(params, function(err, data) {
      if (err) {
          console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
      } else {
          console.log("Query succeeded.");
          res.json(data);
          data.Items.forEach(function(item) {
              console.log(" -", item.year + ": " + item.title + " (" + item.rating + ")");
          });
      }
  });
}

app.use(cors())
app.get('/create', createNewTable)
app.get('/destroy', destroyTable)
app.get('/query/:year/:name/:rating', queryTable)

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
