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
              "info":  movie.info
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

app.use(cors())
app.get('/create', createNewTable)

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
