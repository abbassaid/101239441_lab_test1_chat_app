const path = require('path');
const http = require('http');
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const socketio = require('socket.io');

// Models
const userModel = require('./models/User');
const groupMessagesModel = require('./models/Groupchat');
const messageFormat = require('./models/messages');
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./models/users');

// Constants
const PORT = process.env.PORT || 8080;
const botName = "Chat App";

// MongoDB connection string
const database = 'mongodb+srv://abbassaid:GeorgeBrown123@cluster0.e8qefyb.mongodb.net/comp3133_labtest1?retryWrites=true&w=majority';

// MongoDB connection setup
mongoose.connect(database, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log('Error while MongoDB connection:', err));

// Express app setup
const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'view')));

// Socket.io connection setup
io.on('connection', socket => {
  socket.on('joinRoom', handleJoinRoom(socket));
  socket.on('chatMessage', handleChatMessage(socket));
  socket.on('disconnect', handleDisconnect(socket));
});

// Express routes
app.get('/signup', (req, res) => res.sendFile(path.join(__dirname, 'view', 'signup.html')));
app.post('/login', (req, res) => res.sendFile(path.join(__dirname, 'view', 'login.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'view', 'login.html')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'view', 'login.html')));
app.get('/chat/:room', handleChatRoomGet);
app.post('/chat', handleChatPost);

// Server start
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Handler functions
function handleJoinRoom(socket) {
  return ({ username, room }) => {
    const user = userJoin(socket.id, username, room);
    const current_time = getCurrentTime();

    socket.join(user.room);
    socket.emit('message', messageFormat(botName, 'Start Chatting With Us...', current_time));
    socket.broadcast.to(user.room).emit('message', messageFormat(botName, `${user.username} joined the chat`, current_time));
    io.to(user.room).emit('roomUsers', { room: user.room, users: getRoomUsers(user.room) });
  };
}

function handleChatMessage(socket) {
  return msg => {
    const user = getCurrentUser(socket.id);
    const current_time = getCurrentTime();
    io.to(user.room).emit('message', messageFormat(user.username, msg, current_time));
  };
}

function handleDisconnect(socket) {
  return () => {
    const user = userLeave(socket.id);
    const current_time = getCurrentTime();

    if (user) {
      io.to(user.room).emit('message', messageFormat(botName, `${user.username} left the chat`, current_time));
      io.to(user.room).emit('roomUsers', { room: user.room, users: getRoomUsers(user.room) });
    }
  };
}

function getCurrentTime() {
  const date = new Date();
  return `${date.getHours()}:${date.getMinutes()<10?'0':''}${date.getMinutes()} - ${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`;
}

async function handleChatRoomGet(req, res) {
  const room = req.params.room;
  try {
    const messages = await groupMessagesModel.find({ room: room }).sort({ 'date_sent': 'desc' }).limit(10);
    if (messages.length != 0) {
      res.send(messages);
    } else {
      res.sendFile(path.join(__dirname, 'html', 'chat.html'));
    }
  } catch (err) {
    res.status(500).send(err);
  }
}

async function handleChatPost(req, res) {
  const username = req.body.username;
  try {
    const user = await userModel.findOne({ username: username });
    if (user) {
      return res.redirect(`/chat/${username}`);
    } else {
      return res.redirect('/?err=noUser');
    }
  } catch (err) {
    res.status(500).send(err);
  }
}

app.post('/', async (req, res) => {
  const username=req.body.username
  const password=req.body.password
  const user = await userModel.find({username:username});
  try {
    if(user.length != 0){
      if(user[0].password==password){
        return res.redirect('/')
      }
      else{
        return res.redirect('/login?wrong=pass')
      }
    }else{
      return res.redirect('/login?wrong=uname')
    }
  } catch (err) {
    res.status(500).send(err);
  }
});