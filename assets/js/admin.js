/**
 * Admin Panel Client Logic
 * Handles Authentication, Session Guard, and Messages Dashboard
 * Ethan McClarence Gacud Portfolio
 */

document.addEventListener('DOMContentLoaded', () => {
  const isLoginPage = document.getElementById('adminLoginForm') !== null;
  const isDashboardPage = document.getElementById('adminDashboard') !== null;

  if (isLoginPage) {
    initAdminLogin();
  } else if (isDashboardPage) {
    initAdminDashboard();
  }
});

/* ============================================================
   ADMIN LOGIN LOGIC
   ============================================================ */
function initAdminLogin() {
  const form = document.getElementById('adminLoginForm');
  const usernameInput = document.getElementById('adminUsername');
  const passwordInput = document.getElementById('adminPassword');
  const submitBtn = document.getElementById('loginSubmitBtn');
  const errorBox = document.getElementById('loginErrorBox');
  const errorMsg = document.getElementById('loginErrorMsg');

  // Check if session is already active; redirect if so
  checkExistingSession();

  async function checkExistingSession() {
    try {
      const res = await fetch('../api/admin-session.php');
      const data = await res.json();
      if (data.authenticated) {
        window.location.replace('dashboard.html');
      }
    } catch (err) {
      console.warn('Session pre-check could not be completed:', err);
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (errorBox) errorBox.style.display = 'none';

    const username = usernameInput?.value.trim() || '';
    const password = passwordInput?.value || '';

    if (!username || !password) {
      showError('Please enter both username and password.');
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Authenticating...';
    }

    try {
      const res = await fetch('../api/admin-login.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (res.ok && data.status === 'success') {
        window.location.replace('dashboard.html');
      } else {
        showError(data.message || 'Invalid login credentials.');
      }
    } catch (err) {
      console.error('Login error:', err);
      showError('Could not reach backend server. Please verify Apache and MySQL are running.');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Sign In <i class="fa-solid fa-arrow-right"></i>';
      }
    }
  });

  function showError(msg) {
    if (errorMsg) errorMsg.textContent = msg;
    if (errorBox) errorBox.style.display = 'flex';
  }
}

/* ============================================================
   ADMIN DASHBOARD LOGIC
   ============================================================ */
function initAdminDashboard() {
  const adminUserBadge = document.getElementById('adminUserBadge');
  const logoutBtn = document.getElementById('adminLogoutBtn');
  const refreshBtn = document.getElementById('refreshMessagesBtn');
  const searchInput = document.getElementById('messagesSearchInput');
  const messagesTableBody = document.getElementById('messagesTableBody');
  const messageCountBadge = document.getElementById('messageCountBadge');
  const emptyState = document.getElementById('emptyMessagesState');
  const loadingIndicator = document.getElementById('messagesLoading');

  let allMessages = [];

  // Verify authentication immediately
  verifySession();

  async function verifySession() {
    try {
      const res = await fetch('../api/admin-session.php');
      const data = await res.json();

      if (!data.authenticated) {
        window.location.replace('login.html');
        return;
      }

      if (adminUserBadge && data.user?.username) {
        adminUserBadge.textContent = data.user.username;
      }

      // Session verified; load messages
      loadMessages();
    } catch (err) {
      console.error('Auth check error:', err);
      window.location.replace('login.html');
    }
  }

  // Load Messages from API
  async function loadMessages() {
    if (loadingIndicator) loadingIndicator.style.display = 'block';
    if (emptyState) emptyState.style.display = 'none';
    if (messagesTableBody) messagesTableBody.innerHTML = '';

    try {
      const res = await fetch('../api/admin-messages.php');
      if (res.status === 401) {
        window.location.replace('login.html');
        return;
      }

      const data = await res.json();

      if (res.ok && data.status === 'success') {
        allMessages = data.messages || [];
        renderMessages(allMessages);
      } else {
        alert(data.message || 'Failed to retrieve messages.');
      }
    } catch (err) {
      console.error('Fetch messages error:', err);
      alert('Error fetching messages from database.');
    } finally {
      if (loadingIndicator) loadingIndicator.style.display = 'none';
    }
  }

  // Render Messages Table securely (preventing XSS)
  function renderMessages(messages) {
    if (messageCountBadge) {
      messageCountBadge.textContent = `${messages.length} message${messages.length === 1 ? '' : 's'}`;
    }

    if (!messagesTableBody) return;
    messagesTableBody.innerHTML = '';

    if (!messages.length) {
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    messages.forEach((msg) => {
      const tr = document.createElement('tr');

      // ID
      const tdId = document.createElement('td');
      tdId.className = 'td-id';
      tdId.textContent = `#${msg.id}`;

      // Name
      const tdName = document.createElement('td');
      tdName.className = 'td-name';
      tdName.textContent = msg.name;

      // Email
      const tdEmail = document.createElement('td');
      tdEmail.className = 'td-email';
      const emailLink = document.createElement('a');
      emailLink.href = `mailto:${encodeURIComponent(msg.email)}`;
      emailLink.textContent = msg.email;
      tdEmail.appendChild(emailLink);

      // Message Content
      const tdMsg = document.createElement('td');
      tdMsg.className = 'td-message';
      const msgBox = document.createElement('div');
      msgBox.className = 'message-bubble';
      msgBox.textContent = msg.message; // textContent escapes HTML automatically
      tdMsg.appendChild(msgBox);

      // Date Sent
      const tdDate = document.createElement('td');
      tdDate.className = 'td-date';
      tdDate.textContent = formatDate(msg.date_sent);

      // Actions (Delete)
      const tdActions = document.createElement('td');
      tdActions.className = 'td-actions';
      const delBtn = document.createElement('button');
      delBtn.className = 'btn-delete';
      delBtn.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
      delBtn.title = 'Delete message';
      delBtn.setAttribute('aria-label', `Delete message #${msg.id}`);
      delBtn.addEventListener('click', () => deleteMessage(msg.id));
      tdActions.appendChild(delBtn);

      tr.appendChild(tdId);
      tr.appendChild(tdName);
      tr.appendChild(tdEmail);
      tr.appendChild(tdMsg);
      tr.appendChild(tdDate);
      tr.appendChild(tdActions);

      messagesTableBody.appendChild(tr);
    });
  }

  // Delete message handler
  async function deleteMessage(id) {
    if (!confirm(`Are you sure you want to delete message #${id}?`)) {
      return;
    }

    try {
      const res = await fetch('../api/admin-messages.php', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id })
      });

      const data = await res.json();
      if (res.ok && data.status === 'success') {
        allMessages = allMessages.filter((m) => m.id !== id);
        renderMessages(allMessages);
      } else {
        alert(data.message || 'Failed to delete message.');
      }
    } catch (err) {
      console.error('Delete message error:', err);
      alert('Error connecting to server.');
    }
  }

  // Search filter
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase().trim();
      if (!term) {
        renderMessages(allMessages);
        return;
      }

      const filtered = allMessages.filter((m) => {
        return (
          (m.name || '').toLowerCase().includes(term) ||
          (m.email || '').toLowerCase().includes(term) ||
          (m.message || '').toLowerCase().includes(term)
        );
      });

      renderMessages(filtered);
    });
  }

  // Refresh button
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      loadMessages();
    });
  }

  // Logout handler
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await fetch('../api/admin-logout.php', { method: 'POST' });
      } catch (err) {
        console.warn('Logout API error:', err);
      } finally {
        window.location.replace('login.html');
      }
    });
  }

  function formatDate(raw) {
    if (!raw) return '—';
    try {
      const d = new Date(raw.replace(' ', 'T'));
      if (isNaN(d.getTime())) return raw;
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return raw;
    }
  }
}
