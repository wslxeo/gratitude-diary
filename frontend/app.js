const API_URL = 'http://localhost:3000/api';

// Проверка авторизации
const token = localStorage.getItem('token');
if (!token) {
  window.location.href = 'login.html';
}

// Загрузка данных
async function loadEntries() {
  const res = await fetch(`${API_URL}/entries`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
    return;
  }
  const data = await res.json();
  renderEntries(data.entries || []);
  renderLetters(data.received || []);
}

// Отображение моих записей
function renderEntries(entries) {
  const container = document.getElementById('entriesList');
  if (entries.length === 0) {
    container.innerHTML = '<p style="color:#8a7e72;">Пока нет записей. Напишите первую! </p>';
    return;
  }
  container.innerHTML = entries.map(entry => `
    <div class="entry-item">
      <div>${entry.text}</div>
      <div class="date">${new Date(entry.date).toLocaleDateString('ru-RU')}</div>
      <button class="delete-btn" data-id="${entry.id}">🗑️</button>
    </div>
  `).join('');

  // Удаление записей
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      await fetch(`${API_URL}/entries/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      loadEntries();
    });
  });
}

// Отображение полученных писем
function renderLetters(letters) {
  const container = document.getElementById('receivedLettersList');
  if (!letters || letters.length === 0) {
    container.innerHTML = '<p style="color:#8a7e72;">Писем пока нет. Будьте первым, кто подарит радость! </p>';
    return;
  }
  container.innerHTML = letters.map(letter => `
    <div class="letter-item">
      <div>💌 ${letter.text}</div>
      <div class="date">От: ${letter.from || 'Аноним'} • ${new Date(letter.date).toLocaleDateString('ru-RU')}</div>
    </div>
  `).join('');
}

// Сохранение новой записи
document.getElementById('saveEntryBtn').addEventListener('click', async () => {
  const text = document.getElementById('entryText').value.trim();
  if (text.length < 5) {
    alert('Напишите хотя бы 5 символов!');
    return;
  }

  const res = await fetch(`${API_URL}/entries`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ text })
  });

  if (res.ok) {
    document.getElementById('entryText').value = '';
    loadEntries();
  } else {
    alert('Ошибка при сохранении');
  }
});

// Выход
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('token');
  window.location.href = 'login.html';
});

// Загрузка при старте
loadEntries();