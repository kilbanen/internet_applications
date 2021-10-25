const apiKey = process.env.API_KEY
const express = require('express')
const axios = require('axios')
const cors = require('cors')
const app = express()
const port = 3000
app.use(cors())
app.get('/weather/:city', getWeatherData)

function getWeatherData(req, res) {
  let city = req.params.city
  axios.get(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&APPID=${apiKey}`)
       .then(response => res.json(response.data))
       .catch(err => console.log(err))
}

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
