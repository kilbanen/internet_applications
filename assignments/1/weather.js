const apiKey = process.env.API_KEY
const express = require('express')
const axios = require('axios')
const cors = require('cors')
const app = express()
const port = 3000
app.use(cors())
app.get('/weather/:city', getWeatherData)
app.get('/pollution/:lat/:lon', getPollutionData)

function getWeatherData(req, res) {
  let city = req.params.city
  axios.get(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&APPID=${apiKey}`)
       .then(response => res.json(response.data))
       .catch(err => console.log(err))
}

function getPollutionData(req, res) {
  let lat = req.params.lat
  let lon = req.params.lon
  axios.get(`http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`)
       .then(response => console.log(response.data))
       .catch(err => console.log(err))
}

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
