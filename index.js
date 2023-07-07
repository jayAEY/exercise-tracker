const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose')
const { Schema } = mongoose;
const bodyParser = require('body-parser')

mongoose.connect(process.env['MONGO_URI'], {
  useNewUrlParser: true,
  useUnifiedTopology: true
},
  () => console.log('connected')
);

const exerciseSchema = new Schema({
  userId: { type: String, required: true },
  description: String,
  duration: Number,
  date: Date,
})

const userSchema = new Schema({
  username: String
})

const Exercise = mongoose.model('Exercise', exerciseSchema);
const User = mongoose.model("User", userSchema);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


app.post("/api/users", (req, res) => {
  let newUser = new User({
    username: req.body.username
  })
  newUser.save((err, data) => {
    if (err || data === '') {
      res.send({ 'error': err })
    } else {
      res.json(data)
    }
  })
});

app.post("/api/users/:_id/exercises", (req, res) => {
  User.findById(req.params._id, (err, userData) => {
    if (err || userData === '') {
      res.send({ 'error': err })
    } else {
      let date = req.body.date ? new Date(req.body.date) : new Date()
      let newExercise = new Exercise({
        userId: req.params._id,
        description: req.body.description,
        duration: req.body.duration,
        date: date,
      })
      newExercise.save((err, data) => {
        if (err || data === '') {
          res.send({ 'error': err })
        } else {
          res.json({
            username: userData.username,
            description: data.description,
            duration: data.duration,
            date: data.date.toDateString(),
            _id: userData.id
          })
        }
      })
    }
  })
});

app.get("/api/users/:_id/logs", (req, res) => {
  User.findById(req.params._id, (err, userData) => {
    if (err || userData === '') {
      res.send('Could not find user')
    } else {
      let date = {};
      if (req.query.from) {
        date['$gte'] = new Date(req.query.from)
      }
      if (req.query.to) {
        date['$lte'] = new Date(req.query.to)
      }
      let search = { userId: req.params._id }
      if (req.query.from || req.query.to) {
        search[date] = date
      }
      let limit = req.query.limit ? req.query.limit : 100
      Exercise.find(search).limit(+limit).exec((err, data) => {
        if (err || !data) {
          console.log({ 'error': err })
        } else {
          let count = data.length
          let log = data
          let username = userData.username
          let _id = userData._id
          let newLog = log.map((exercise) => {
            return {
              "description": exercise.description,
              "duration": exercise.duration,
              "date": exercise.date.toDateString()
            }  
          }
          )
          res.json({
            "_id": _id,
            "username": username,
            "count": count,
            "log": newLog
          })
        }
      })
    }
  })
})

app.get("/api/users", (req, res) => {
  User.find({}, (err, data) => {
    if (err) {
      res.send({ 'error': err })
    } else if (!data) {
      res.send('No Users')
    } else {
      res.json(data)
    }
  })
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
