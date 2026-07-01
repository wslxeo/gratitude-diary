const API_URL = 'http://localhost:3000/api';

// ===== ЛОГИН =====
document.getElementById('loginBtn')?.addEventListener('click', async () => {
  const username = document.getElementById('loginUsername').value;
  const password = document.getElementById('loginPassword').value;
  const errorEl = document.getElementById('loginError');

  if (!username || !password) {
    errorEl.textContent = 'Заполните все поля';
    return;
  }

  try {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (res.ok) {
      const data = await res.json();
      localStorage.setItem('token', data.token);
      localStorage.setItem('username', data.username);
      window.location.href = 'index.html';
    } else {
      const error = await res.json();
      errorEl.textContent = error.error || 'Ошибка входа';
    }
  } catch (err) {
    errorEl.textContent = 'Ошибка соединения с сервером';
  }
});

// ===== РЕГИСТРАЦИЯ =====
document.getElementById('registerBtn')?.addEventListener('click', async () => {
  const username = document.getElementById('registerUsername').value;
  const password = document.getElementById('registerPassword').value;
  const errorEl = document.getElementById('registerError');

  if (!username || !password) {
    errorEl.textContent = 'Заполните все поля';
    return;
  }

  if (password.length < 4) {
    errorEl.textContent = 'Пароль должен быть минимум 4 символа';
    return;
  }

  try {
    const res = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (res.ok) {
      alert('Регистрация успешна! Теперь войдите.');
      window.location.href = 'login.html';
    } else {
      const error = await res.json();
      errorEl.textContent = error.error || 'Ошибка регистрации';
    }
  } catch (err) {
    errorEl.textContent = 'Ошибка соединения с сервером';
  }
});

// Если пользователь уже авторизован — перенаправляем на главную
if (localStorage.getItem('token') && window.location.pathname.includes('login')) {
  window.location.href = 'index.html';
}