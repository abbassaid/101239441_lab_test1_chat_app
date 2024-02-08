// DOM elements
const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');
const roomName = document.getElementById('room-name');
const userList = document.getElementById('users');
const leaveBtn = document.getElementById('leave-btn');

// Query parameters
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

// Socket initialization
const socket = io();

// Event listeners
socket.on('roomUsers', ({ room, users }) => outputRoomUsers(room, users));
socket.on('message', message => outputMessage(message));
chatForm.addEventListener('submit', handleChatFormSubmit);
leaveBtn.addEventListener('click', handleLeaveRoom);

// Emit events
socket.emit('joinRoom', { username, room });

// Functions
function handleChatFormSubmit(event) {
  event.preventDefault();
  let msg = event.target.elements.msg.value.trim();
  if (msg) {
    socket.emit('chatMessage', msg);
    event.target.elements.msg.value = '';
    event.target.elements.msg.focus();
  }
}

function outputMessage(message) {
  const div = document.createElement('div');
  div.classList.add('message');

  const metaP = document.createElement('p');
  metaP.classList.add('meta');
  metaP.innerText = `${message.username} ${message.time}`;
  div.appendChild(metaP);

  const textP = document.createElement('p');
  textP.classList.add('text');
  textP.innerText = message.text;
  div.appendChild(textP);

  chatMessages.appendChild(div);
}

function outputRoomUsers(room, users) {
  roomName.innerText = room;
  userList.innerHTML = users.map(user => `<li>${user.username}</li>`).join('');
}

function handleLeaveRoom() {
  if (confirm('Are you sure you want to leave?')) {
    window.location = '../index.html';
  }
}
