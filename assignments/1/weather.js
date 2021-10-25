const apiKey = process.env.API_KEY
const express = require('express')
const axios = require('axios')
const app = express()
const port = 3000

app.get('/', getWeatherData)

function getWeatherData(req, res) {
  axios.get(`https://api.openweathermap.org/data/2.5/weather?q=Dublin,Ireland&APPID=${apiKey}`)
       .then(response => response.data)
       .then(response => console.log(response))
       .catch(err => console.log(err))
}

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
