const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const SECRET_KEY = 'your-secret-key-change-me';

// Middleware
app.use(cors());
app.use(express.json());

// Путь к файлу с данными
const DATA_FILE = path.join(__dirname, 'data', 'users.json');

// Инициализация данных
function initData() {
  if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'));
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ users: [] }, null, 2));
  }
}
initData();

// Чтение данных
function readData() {
  const raw = fs.readFileSync(DATA_FILE);
  return JSON.parse(raw);
}

// Запись данных
function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Middleware для проверки токена
function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// ----- РЕГИСТРАЦИЯ -----
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password || password.length < 4) {
    return res.status(400).json({ error: 'Invalid data' });
  }

  const data = readData();
  if (data.users.find(u => u.username === username)) {
    return res.status(400).json({ error: 'User already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = {
    id: uuidv4(),
    username,
    password: hashedPassword,
    entries: [],
    receivedLetters: []
  };

  data.users.push(newUser);
  writeData(data);

  res.status(201).json({ message: 'User created successfully' });
});

// ----- ЛОГИН -----
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const data = readData();
  const user = data.users.find(u => u.username === username);

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ userId: user.id }, SECRET_KEY, { expiresIn: '7d' });
  res.json({ token, username: user.username });
});

// ----- ПОЛУЧИТЬ ЗАПИСИ ПОЛЬЗОВАТЕЛЯ -----
app.get('/api/entries', authenticate, (req, res) => {
  const data = readData();
  const user = data.users.find(u => u.id === req.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ entries: user.entries, received: user.receivedLetters || [] });
});

// ----- ДОБАВИТЬ ЗАПИСЬ -----
app.post('/api/entries', authenticate, (req, res) => {
  const { text } = req.body;
  if (!text || text.length < 5) {
    return res.status(400).json({ error: 'Entry too short' });
  }

  const data = readData();
  const user = data.users.find(u => u.id === req.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const newEntry = {
    id: uuidv4(),
    text,
    date: new Date().toISOString(),
    isAnonymous: false
  };

  user.entries.push(newEntry);
  writeData(data);

  // Отправляем "письмо счастья" случайному пользователю (кроме себя)
  const otherUsers = data.users.filter(u => u.id !== req.userId);
  if (otherUsers.length > 0) {
    const randomUser = otherUsers[Math.floor(Math.random() * otherUsers.length)];
    if (randomUser) {
      randomUser.receivedLetters = randomUser.receivedLetters || [];
      randomUser.receivedLetters.push({
        id: uuidv4(),
        from: user.username,
        text: text,
        date: new Date().toISOString()
      });
      writeData(data);
    }
  }

  res.status(201).json({ message: 'Entry added', entry: newEntry });
});

// ----- УДАЛИТЬ ЗАПИСЬ (свою) -----
app.delete('/api/entries/:id', authenticate, (req, res) => {
  const data = readData();
  const user = data.users.find(u => u.id === req.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const entryIndex = user.entries.findIndex(e => e.id === req.params.id);
  if (entryIndex === -1) {
    return res.status(404).json({ error: 'Entry not found' });
  }

  user.entries.splice(entryIndex, 1);
  writeData(data);
  res.json({ message: 'Entry deleted' });
});

app.listen(PORT, () => {
  console.log(` Server running on http://localhost:${PORT}`);
});