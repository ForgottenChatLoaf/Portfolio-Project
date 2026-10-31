/**
 * Admin Panel Client Logic (Secured & Upgraded)
 * Handles Authentication, Real-time Dashboard, Custom Deletion Modal,
 * Message Inspector, Status Workflow, and Safe CSV Exports
 * Ethan McClarence Gacud Portfolio
 */

document.addEventListener('DOMContentLoaded', () => {
  const isLoginPage = document.getElementById('adminLoginForm') !== null;
  const isDashboardPage = document.getElementById('adminDashboard') !== null;
  const isMessagesPage = document.getElementById('adminMessagesPage') !== null;

  if (isLoginPage) {
    initAdminLogin();
  } else if (isDashboardPage || isMessagesPage) {
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

  form?.addEventListener('submit', async (e) => {
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
  const isOverviewPage = document.getElementById('adminDashboard') !== null;
  const adminUserBadge = document.getElementById('adminUserBadge');
  const logoutBtn = document.getElementById('adminLogoutBtn');
  const refreshBtn = document.getElementById('refreshMessagesBtn');
  const refreshDashboardBtn = document.getElementById('refreshDashboardBtn');
  const markAllReadBtn = document.getElementById('markAllReadBtn');
  const overviewMarkAllReadBtn = document.getElementById('overviewMarkAllReadBtn');
  const searchInput = document.getElementById('messagesSearchInput');
  const sortSelect = document.getElementById('messagesSortSelect');
  const messagesTableBody = document.getElementById('messagesTableBody');
  const emptyState = document.getElementById('emptyMessagesState');
  const emptyStateMessage = document.getElementById('emptyStateMessage');
  const loadingIndicator = document.getElementById('messagesLoading');
  const tableContainer = document.getElementById('tableContainer');

  // Stat Counter Elements
  const statTotal = document.getElementById('statTotal');
  const statNew = document.getElementById('statNew');
  const statWeek = document.getElementById('statWeek');
  const statReplied = document.getElementById('statReplied');
  const statNewContext = document.getElementById('statNewContext');

  // Sidebar & topbar
  const sidebarEl = document.getElementById('adminSidebar');
  const sidebarToggleBtn = document.getElementById('sidebarToggle');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  const topbarUserAvatar = document.getElementById('topbarUserAvatar');
  const topbarUserName = document.getElementById('topbarUserName');
  const sidebarNewCount = document.getElementById('sidebarNewCount');

  // Greeting
  const greetingLabel = document.getElementById('dashGreetingLabel');
  const dashCurrentTime = document.getElementById('dashCurrentTime');

  // Filter Tab Badges
  const countAll = document.getElementById('countAll');
  const countNew = document.getElementById('countNew');
  const countRead = document.getElementById('countRead');
  const countReplied = document.getElementById('countReplied');
  const countArchived = document.getElementById('countArchived');
  const filterTabs = document.querySelectorAll('.admin-tabs .tab-btn');

  // Custom Deletion Modal Elements
  const deleteModal = document.getElementById('deleteConfirmModal');
  const delModalId = document.getElementById('delModalId');
  const delModalSender = document.getElementById('delModalSender');
  const delModalSnippet = document.getElementById('delModalSnippet');
  const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

  // Message Inspector Modal Elements
  const detailModal = document.getElementById('messageDetailModal');
  const detailModalIdBadge = document.getElementById('detailModalIdBadge');
  const detailSenderName = document.getElementById('detailSenderName');
  const detailSenderEmail = document.getElementById('detailSenderEmail');
  const detailDateSent = document.getElementById('detailDateSent');
  const detailStatusBadgeWrap = document.getElementById('detailStatusBadgeWrap');
  const detailMessageContent = document.getElementById('detailMessageContent');
  const detailReplyMailtoBtn = document.getElementById('detailReplyMailtoBtn');
  const detailDeleteShortcutBtn = document.getElementById('detailDeleteShortcutBtn');
  const closeDetailModalBtn = document.getElementById('closeDetailModalBtn');
  const detailDoneBtn = document.getElementById('detailDoneBtn');
  const detailStatusBtns = document.querySelectorAll('[data-status-btn]');

  // Toast Container
  const toast = document.getElementById('adminToast');
  const toastMessage = document.getElementById('toastMessage');

  // State
  let allMessages = [];
  let currentFilter = 'all';
  let currentSearch = '';
  let currentSort = 'newest';
  let activeDeleteTarget = null;
  let activeInspectorTarget = null;
  let csrfToken = '';

  // Profile & Appearance State (with local cache pre-render for zero flicker)
  let currentAdminProfile = {
    username: 'admin',
    display_name: 'Ethan',
    avatar_url: null,
    accent_color: '#6c63ff'
  };

  try {
    const cached = localStorage.getItem('admin_profile_cache');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && typeof parsed === 'object') {
        currentAdminProfile = { ...currentAdminProfile, ...parsed };
        if (currentAdminProfile.accent_color) applyAccentColor(currentAdminProfile.accent_color);
      }
    }
  } catch (e) {}

  // Initial sync before verifySession completes
  syncTopbarUser();

  // 1. Verify authentication immediately
  verifySession();

  // 2. Initialise greeting, clock, sidebar, and profile editor
  initGreetingAndClock();
  initSidebarToggle();
  initAdminProfileModal();

  function getGreetingForHour(hour, name) {
    const safeName = (name && name.trim()) ? name.trim() : 'Ethan';
    // 5:00 AM to 11:59 AM
    if (hour >= 5 && hour < 12) {
      return `Good morning, ${safeName}. <i class="fa-solid fa-sun greeting-icon" style="color: #f59e0b; margin-left: 6px;" aria-hidden="true"></i>`;
    }
    // 12:00 PM to 4:59 PM
    if (hour >= 12 && hour < 17) {
      return `Good afternoon, ${safeName}. <i class="fa-solid fa-cloud-sun greeting-icon" style="color: #f59e0b; margin-left: 6px;" aria-hidden="true"></i>`;
    }
    // 5:00 PM to 4:59 AM
    return `Good evening, ${safeName}. <i class="fa-solid fa-moon greeting-icon" style="color: #818cf8; margin-left: 6px;" aria-hidden="true"></i>`;
  }

  function updateGreeting() {
    const now = new Date();
    const greeting = getGreetingForHour(now.getHours(), currentAdminProfile.display_name);
    if (greetingLabel) greetingLabel.innerHTML = greeting;
    if (dashCurrentTime) {
      dashCurrentTime.textContent = now.toLocaleTimeString(undefined, {
        hour: '2-digit', minute: '2-digit'
      });
    }
  }

  function initGreetingAndClock() {
    updateGreeting();
    setInterval(updateGreeting, 60000);
  }

  function applyAccentColor(hex) {
    if (!hex) return;
    const cleanHex = hex.toLowerCase();
    document.documentElement.style.setProperty('--accent', cleanHex);
    const r = parseInt(cleanHex.slice(1, 3), 16) || 108;
    const g = parseInt(cleanHex.slice(3, 5), 16) || 99;
    const b = parseInt(cleanHex.slice(5, 7), 16) || 255;
    document.documentElement.style.setProperty('--accent-glow', `rgba(${r}, ${g}, ${b}, 0.28)`);
    document.documentElement.style.setProperty('--accent-dim', `rgba(${r}, ${g}, ${b}, 0.12)`);
    document.documentElement.style.setProperty('--border-hover', `rgba(${r}, ${g}, ${b}, 0.45)`);
  }

  function syncTopbarUser() {
    const displayName = currentAdminProfile.display_name || currentAdminProfile.username || 'Ethan';
    const initial = displayName.charAt(0).toUpperCase() || 'E';

    if (topbarUserName) {
      topbarUserName.textContent = displayName;
    }
    if (topbarUserAvatar) {
      if (currentAdminProfile.avatar_url) {
        topbarUserAvatar.innerHTML = `<img src="../${currentAdminProfile.avatar_url}" alt="${displayName}">`;
        const img = topbarUserAvatar.querySelector('img');
        if (img) {
          img.onerror = () => {
            topbarUserAvatar.textContent = initial;
          };
        }
      } else {
        topbarUserAvatar.textContent = initial;
      }
    }
    updateGreeting();
  }

  function initSidebarToggle() {
    if (!sidebarToggleBtn || !sidebarEl) return;
    const openSidebar = () => {
      sidebarEl.classList.add('open');
      if (sidebarOverlay) sidebarOverlay.classList.add('visible');
      sidebarToggleBtn.setAttribute('aria-expanded', 'true');
    };
    const closeSidebar = () => {
      sidebarEl.classList.remove('open');
      if (sidebarOverlay) sidebarOverlay.classList.remove('visible');
      sidebarToggleBtn.setAttribute('aria-expanded', 'false');
    };
    sidebarToggleBtn.addEventListener('click', () => {
      sidebarEl.classList.contains('open') ? closeSidebar() : openSidebar();
    });
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && sidebarEl.classList.contains('open')) closeSidebar();
    });
  }

  async function verifySession() {
    try {
      const res = await fetch('../api/admin-session.php');
      const data = await res.json();

      if (!data.authenticated) {
        window.location.replace('login.html');
        return;
      }

      if (data.csrf_token) {
        csrfToken = data.csrf_token;
      }

      if (data.user) {
        if (data.user.username) currentAdminProfile.username = data.user.username;
        if (data.user.display_name) currentAdminProfile.display_name = data.user.display_name;
        currentAdminProfile.avatar_url = data.user.avatar_url || null;
        if (data.user.accent_color) {
          currentAdminProfile.accent_color = data.user.accent_color;
          applyAccentColor(data.user.accent_color);
        }
        if (adminUserBadge && data.user.username) {
          adminUserBadge.textContent = data.user.username;
        }
        try {
          localStorage.setItem('admin_profile_cache', JSON.stringify(currentAdminProfile));
        } catch (e) {}
        syncTopbarUser();
      }

      // Session verified; load messages
      loadMessages();
    } catch (err) {
      console.error('Auth check error:', err);
      window.location.replace('login.html');
    }
  }

  // Helper to ensure CSRF token is available
  async function ensureCsrfToken() {
    if (csrfToken) return csrfToken;
    try {
      const res = await fetch('../api/csrf-token.php');
      const data = await res.json();
      if (data.csrf_token) {
        csrfToken = data.csrf_token;
      }
    } catch (e) {
      console.warn('Could not fetch CSRF token:', e);
    }
    return csrfToken;
  }

  // 2. Load Messages from API
  async function loadMessages() {
    if (loadingIndicator) loadingIndicator.style.display = 'block';
    if (emptyState) emptyState.style.display = 'none';
    if (tableContainer) tableContainer.style.display = 'none';

    try {
      const res = await fetch('../api/admin-messages.php');
      if (res.status === 401) {
        window.location.replace('login.html');
        return;
      }

      const data = await res.json();

      if (res.ok && data.status === 'success') {
        if (data.csrf_token) {
          csrfToken = data.csrf_token;
        }
        allMessages = data.messages || [];
        updateStatistics(data.stats || computeClientStats(allMessages));
        applyFiltersAndRender();
      } else {
        showToast(data.message || 'Failed to retrieve messages.', 'error');
      }
    } catch (err) {
      console.error('Fetch messages error:', err);
      showToast('Error connecting to server. Ensure MySQL is running.', 'error');
    } finally {
      if (loadingIndicator) loadingIndicator.style.display = 'none';
    }
  }

  // 3. Update Statistics & Tab Counts
  function updateStatistics(stats) {
    if (!stats) return;

    if (statTotal) statTotal.textContent = stats.total ?? allMessages.length;
    const newCount = stats.new ?? 0;
    if (statNew) statNew.textContent = newCount;
    if (statNewContext) {
      statNewContext.textContent = newCount === 0 ? 'All caught up' : `${newCount} need${newCount === 1 ? 's' : ''} review`;
    }
    if (statWeek) statWeek.textContent = stats.this_week ?? 0;
    if (statReplied) statReplied.textContent = stats.replied ?? 0;

    // Sidebar badge
    if (sidebarNewCount) {
      if (newCount > 0) {
        sidebarNewCount.textContent = newCount;
        sidebarNewCount.style.display = '';
      } else {
        sidebarNewCount.style.display = 'none';
      }
    }

    // Filter pill counts
    if (countAll) countAll.textContent = allMessages.length;
    if (countNew) countNew.textContent = stats.new ?? countStatus('new');
    if (countRead) countRead.textContent = stats.read ?? countStatus('read');
    if (countReplied) countReplied.textContent = stats.replied ?? countStatus('replied');
    if (countArchived) countArchived.textContent = stats.archived ?? countStatus('archived');
  }

  function countStatus(status) {
    return allMessages.filter(m => (m.status || 'new') === status).length;
  }

  function computeClientStats(messages) {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return {
      total: messages.length,
      new: messages.filter(m => (m.status || 'new') === 'new').length,
      read: messages.filter(m => m.status === 'read').length,
      replied: messages.filter(m => m.status === 'replied').length,
      archived: messages.filter(m => m.status === 'archived').length,
      this_week: messages.filter(m => {
        const sent = new Date((m.date_sent || '').replace(' ', 'T'));
        return !isNaN(sent.getTime()) && sent >= sevenDaysAgo;
      }).length
    };
  }

  // 4. Filter, Sort, and Render
  function applyFiltersAndRender() {
    let list = [...allMessages];

    // On Overview hub, show only the latest 4 inquiries
    if (isOverviewPage) {
      list.sort((a, b) => {
        const dateA = new Date((a.date_sent || '').replace(' ', 'T')).getTime() || 0;
        const dateB = new Date((b.date_sent || '').replace(' ', 'T')).getTime() || 0;
        return dateB - dateA || b.id - a.id;
      });
      renderMessagesTable(list.slice(0, 4));
      return;
    }

    // Status Filter (Messages page)
    if (currentFilter !== 'all') {
      list = list.filter(m => (m.status || 'new') === currentFilter);
    }

    // Search Filter
    if (currentSearch) {
      const term = currentSearch.toLowerCase();
      list = list.filter(m =>
        (m.name || '').toLowerCase().includes(term) ||
        (m.email || '').toLowerCase().includes(term) ||
        (m.message || '').toLowerCase().includes(term) ||
        `#${m.id}`.includes(term)
      );
    }

    // Sort Order
    list.sort((a, b) => {
      const dateA = new Date((a.date_sent || '').replace(' ', 'T')).getTime() || 0;
      const dateB = new Date((b.date_sent || '').replace(' ', 'T')).getTime() || 0;
      return currentSort === 'newest' ? (dateB - dateA || b.id - a.id) : (dateA - dateB || a.id - b.id);
    });

    renderMessagesTable(list);
  }

  // 5. Render Messages Table securely (preventing XSS)
  function renderMessagesTable(messages) {
    if (!messagesTableBody) return;
    messagesTableBody.innerHTML = '';

    if (!messages.length) {
      if (emptyState) {
        emptyState.style.display = 'block';
        if (emptyStateMessage) {
          if (currentSearch) {
            emptyStateMessage.textContent = `No messages match your search term "${currentSearch}".`;
          } else if (currentFilter !== 'all') {
            emptyStateMessage.textContent = `No inquiries currently marked as "${currentFilter}".`;
          } else {
            emptyStateMessage.textContent = 'No contact inquiries have been received yet.';
          }
        }
      }
      if (tableContainer) tableContainer.style.display = 'none';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (tableContainer) tableContainer.style.display = 'block';

    messages.forEach((msg) => {
      const tr = document.createElement('tr');
      tr.style.cursor = 'pointer';

      // Click row to inspect (except when clicking buttons/links)
      tr.addEventListener('click', (e) => {
        if (e.target.closest('button') || e.target.closest('a')) return;
        openMessageInspector(msg);
      });

      // Column 1: ID
      const tdId = document.createElement('td');
      tdId.className = 'td-id';
      tdId.style.fontWeight = '600';
      tdId.style.color = 'var(--text-secondary)';
      tdId.textContent = `#${msg.id}`;

      // Column 2: Status Badge
      const tdStatus = document.createElement('td');
      tdStatus.className = 'td-status';
      const badge = createStatusBadge(msg.status || 'new');
      badge.title = 'Click to inspect & change status';
      badge.addEventListener('click', (e) => {
        e.stopPropagation();
        openMessageInspector(msg);
      });
      tdStatus.appendChild(badge);

      // Column 3: Sender Name & Email (with avatar initial)
      const tdSender = document.createElement('td');
      tdSender.className = 'td-sender';

      const senderWrap = document.createElement('div');
      senderWrap.className = 'sender-row';

      // Avatar initial
      const avatar = document.createElement('span');
      avatar.className = 'sender-avatar';
      const initials = (msg.name || '?').trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
      avatar.textContent = initials;
      avatar.setAttribute('aria-hidden', 'true');
      // Deterministic color from name
      const hue = [...(msg.name || 'A')].reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
      avatar.style.setProperty('--avatar-hue', hue);

      const senderMeta = document.createElement('div');

      const senderName = document.createElement('div');
      senderName.style.fontWeight = '600';
      senderName.style.color = 'var(--text-primary)';
      senderName.textContent = msg.name;

      const emailLink = document.createElement('a');
      emailLink.href = `mailto:${encodeURIComponent(msg.email)}`;
      emailLink.textContent = msg.email;
      emailLink.style.fontSize = '12px';
      emailLink.style.color = 'var(--text-secondary)';
      emailLink.style.display = 'block';
      emailLink.style.marginTop = '2px';
      emailLink.addEventListener('click', (e) => e.stopPropagation());

      senderMeta.appendChild(senderName);
      senderMeta.appendChild(emailLink);
      senderWrap.appendChild(avatar);
      senderWrap.appendChild(senderMeta);
      tdSender.appendChild(senderWrap);

      // Column 4: Message Snippet
      const tdMsg = document.createElement('td');
      tdMsg.className = 'td-message';
      const msgBox = document.createElement('div');
      msgBox.className = 'message-bubble';
      const snippet = msg.message.length > 140 ? msg.message.slice(0, 140) + '...' : msg.message;
      msgBox.textContent = snippet;
      tdMsg.appendChild(msgBox);

      // Column 5: Date Received
      const tdDate = document.createElement('td');
      tdDate.className = 'td-date';
      tdDate.style.fontSize = '12px';
      tdDate.style.color = 'var(--text-secondary)';
      tdDate.textContent = formatDate(msg.date_sent);

      // Column 6: Action Buttons
      const tdActions = document.createElement('td');
      tdActions.className = 'td-actions';
      const actionGroup = document.createElement('div');
      actionGroup.className = 'table-action-btns';

      // Inspect Button
      const inspectBtn = document.createElement('button');
      inspectBtn.className = 'btn-inspect';
      inspectBtn.innerHTML = '<i class="fa-regular fa-eye"></i>';
      inspectBtn.title = 'View full message & reply';
      inspectBtn.setAttribute('aria-label', `View message #${msg.id}`);
      inspectBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openMessageInspector(msg);
      });

      // Custom Delete Button (triggers modal instead of native confirm)
      const delBtn = document.createElement('button');
      delBtn.className = 'btn-delete';
      delBtn.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
      delBtn.title = 'Delete message';
      delBtn.setAttribute('aria-label', `Delete message #${msg.id}`);
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openDeleteModal(msg);
      });

      actionGroup.appendChild(inspectBtn);
      actionGroup.appendChild(delBtn);
      tdActions.appendChild(actionGroup);

      tr.appendChild(tdId);
      tr.appendChild(tdStatus);
      tr.appendChild(tdSender);
      tr.appendChild(tdMsg);
      tr.appendChild(tdDate);
      tr.appendChild(tdActions);

      messagesTableBody.appendChild(tr);
    });
  }

  // Create formatted status badge
  function createStatusBadge(status) {
    const span = document.createElement('span');
    const safeStatus = (status || 'new').toLowerCase();
    span.className = `status-badge status-${safeStatus}`;

    let icon = 'fa-solid fa-circle-dot';
    let label = 'New';

    if (safeStatus === 'read') {
      icon = 'fa-solid fa-envelope-open';
      label = 'Read';
    } else if (safeStatus === 'replied') {
      icon = 'fa-solid fa-reply';
      label = 'Replied';
    } else if (safeStatus === 'archived') {
      icon = 'fa-solid fa-box-archive';
      label = 'Archived';
    }

    span.innerHTML = `<i class="${icon}"></i> ${label}`;
    return span;
  }

  /* ============================================================
     CUSTOM DELETION MODAL LOGIC (NO NATIVE BROWSER CONFIRM)
     ============================================================ */
  function openDeleteModal(msg) {
    activeDeleteTarget = msg;
    if (delModalId) delModalId.textContent = `#${msg.id}`;
    if (delModalSender) delModalSender.textContent = msg.name || 'Unknown Sender';
    if (delModalSnippet) {
      delModalSnippet.textContent = msg.message.length > 100 ? `"${msg.message.slice(0, 100)}..."` : `"${msg.message}"`;
    }

    if (deleteModal) {
      deleteModal.classList.add('open');
      confirmDeleteBtn?.focus();
    }
  }

  function closeDeleteModal() {
    activeDeleteTarget = null;
    if (deleteModal) deleteModal.classList.remove('open');
    if (confirmDeleteBtn) {
      confirmDeleteBtn.disabled = false;
      confirmDeleteBtn.innerHTML = '<i class="fa-solid fa-trash-can"></i> Yes, Delete Message';
    }
  }

  // Confirm delete handler
  confirmDeleteBtn?.addEventListener('click', async () => {
    if (!activeDeleteTarget) return;

    const id = activeDeleteTarget.id;
    const senderName = activeDeleteTarget.name;

    confirmDeleteBtn.disabled = true;
    confirmDeleteBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Deleting...';

    try {
      const token = await ensureCsrfToken();
      const res = await fetch('../api/admin-messages.php', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-Token': token
        },
        body: JSON.stringify({ id, csrf_token: token })
      });

      const data = await res.json();

      if (res.ok && data.status === 'success') {
        allMessages = allMessages.filter(m => m.id !== id);
        updateStatistics(computeClientStats(allMessages));
        applyFiltersAndRender();
        closeDeleteModal();

        // If inspector modal had this message open, close it
        if (activeInspectorTarget?.id === id) {
          closeMessageInspector();
        }

        showToast(`Message #${id} from ${senderName} was deleted.`, 'success');
      } else {
        showToast(data.message || 'Failed to delete message.', 'error');
        confirmDeleteBtn.disabled = false;
        confirmDeleteBtn.innerHTML = '<i class="fa-solid fa-trash-can"></i> Yes, Delete Message';
      }
    } catch (err) {
      console.error('Delete message error:', err);
      showToast('Error connecting to server. Please try again.', 'error');
      confirmDeleteBtn.disabled = false;
      confirmDeleteBtn.innerHTML = '<i class="fa-solid fa-trash-can"></i> Yes, Delete Message';
    }
  });

  cancelDeleteBtn?.addEventListener('click', closeDeleteModal);

  // Close modal when clicking backdrop
  deleteModal?.addEventListener('click', (e) => {
    if (e.target === deleteModal) closeDeleteModal();
  });

  /* ============================================================
     MESSAGE DETAIL INSPECTOR MODAL LOGIC
     ============================================================ */
  function openMessageInspector(msg) {
    activeInspectorTarget = msg;

    if (detailModalIdBadge) detailModalIdBadge.textContent = `#${msg.id}`;
    if (detailSenderName) detailSenderName.textContent = msg.name;

    if (detailSenderEmail) {
      detailSenderEmail.textContent = msg.email;
      detailSenderEmail.href = `mailto:${encodeURIComponent(msg.email)}`;
    }

    if (detailDateSent) detailDateSent.textContent = formatDate(msg.date_sent);

    if (detailStatusBadgeWrap) {
      detailStatusBadgeWrap.innerHTML = '';
      detailStatusBadgeWrap.appendChild(createStatusBadge(msg.status || 'new'));
    }

    if (detailMessageContent) {
      detailMessageContent.textContent = msg.message;
    }

    if (detailReplyMailtoBtn) {
      const subject = encodeURIComponent(`Re: Inquiry from Ethan's Portfolio (#${msg.id})`);
      const body = encodeURIComponent(`Hi ${msg.name},\n\nThank you for reaching out through my portfolio.\n\nBest regards,\nEthan McClarence Gacud`);
      detailReplyMailtoBtn.href = `mailto:${encodeURIComponent(msg.email)}?subject=${subject}&body=${body}`;
    }

    // Highlight current status button
    highlightActiveDetailStatusBtn(msg.status || 'new');

    // Auto mark as 'read' if currently 'new'
    if ((msg.status || 'new') === 'new') {
      updateMessageStatus(msg.id, 'read', false);
    }

    if (detailModal) detailModal.classList.add('open');
  }

  function closeMessageInspector() {
    activeInspectorTarget = null;
    if (detailModal) detailModal.classList.remove('open');
  }

  function highlightActiveDetailStatusBtn(currentStatus) {
    detailStatusBtns.forEach(btn => {
      const btnStatus = btn.getAttribute('data-status-btn');
      if (btnStatus === currentStatus) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  // Update Status handler
  async function updateMessageStatus(id, newStatus, notify = true) {
    try {
      const token = await ensureCsrfToken();
      const res = await fetch('../api/admin-messages.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-Token': token
        },
        body: JSON.stringify({
          action: 'update_status',
          id: id,
          status: newStatus,
          csrf_token: token
        })
      });

      const data = await res.json();

      if (res.ok && data.status === 'success') {
        // Update local object
        const target = allMessages.find(m => m.id === id);
        if (target) {
          target.status = newStatus;
        }

        if (activeInspectorTarget && activeInspectorTarget.id === id) {
          activeInspectorTarget.status = newStatus;
          if (detailStatusBadgeWrap) {
            detailStatusBadgeWrap.innerHTML = '';
            detailStatusBadgeWrap.appendChild(createStatusBadge(newStatus));
          }
          highlightActiveDetailStatusBtn(newStatus);
        }

        updateStatistics(computeClientStats(allMessages));
        applyFiltersAndRender();

        if (notify) {
          showToast(`Message #${id} marked as ${newStatus.toUpperCase()}.`, 'success');
        }
      } else {
        showToast(data.message || 'Failed to update message status.', 'error');
      }
    } catch (err) {
      console.error('Update status error:', err);
      showToast('Error connecting to server. Please try again.', 'error');
    }
  }

  // Status buttons inside detail inspector
  detailStatusBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (!activeInspectorTarget) return;
      const status = btn.getAttribute('data-status-btn');
      if (status && status !== activeInspectorTarget.status) {
        updateMessageStatus(activeInspectorTarget.id, status, true);
      }
    });
  });

  // Shortcut delete from detail modal
  detailDeleteShortcutBtn?.addEventListener('click', () => {
    if (!activeInspectorTarget) return;
    const target = { ...activeInspectorTarget };
    closeMessageInspector();
    openDeleteModal(target);
  });

  closeDetailModalBtn?.addEventListener('click', closeMessageInspector);
  detailDoneBtn?.addEventListener('click', closeMessageInspector);
  detailModal?.addEventListener('click', (e) => {
    if (e.target === detailModal) closeMessageInspector();
  });

  // Global Escape key listener for open modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (deleteModal?.classList.contains('open')) {
        closeDeleteModal();
      } else if (detailModal?.classList.contains('open')) {
        closeMessageInspector();
      }
    }
  });

  /* ============================================================
     FILTER TABS & SEARCH / SORT CONTROLS
     ============================================================ */
  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.getAttribute('data-filter') || 'all';
      applyFiltersAndRender();
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearch = e.target.value.trim();
      applyFiltersAndRender();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value || 'newest';
      applyFiltersAndRender();
    });
  }

  // Mark All As Read Logic
  async function markAllAsRead() {
    const unreadCount = allMessages.filter(m => (m.status || 'new') === 'new').length;
    if (unreadCount === 0) {
      showToast('All messages are already marked as read.', 'info');
      return;
    }

    const token = await ensureCsrfToken();
    const actionBtns = [markAllReadBtn, overviewMarkAllReadBtn].filter(Boolean);

    actionBtns.forEach(btn => {
      btn.disabled = true;
      btn.dataset.origHtml = btn.innerHTML;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Updating...';
    });

    try {
      const res = await fetch('../api/admin-messages.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-Token': token
        },
        body: JSON.stringify({ action: 'mark_all_read', csrf_token: token })
      });

      const data = await res.json();
      if (res.ok && data.status === 'success') {
        showToast(data.message || 'Marked all messages as read!', 'success');
        await loadMessages();
      } else {
        showToast(data.message || 'Failed to update messages.', 'error');
      }
    } catch (err) {
      console.error('Mark all read error:', err);
      showToast('Network error while marking messages as read.', 'error');
    } finally {
      actionBtns.forEach(btn => {
        btn.disabled = false;
        if (btn.dataset.origHtml) btn.innerHTML = btn.dataset.origHtml;
      });
    }
  }

  markAllReadBtn?.addEventListener('click', markAllAsRead);
  overviewMarkAllReadBtn?.addEventListener('click', markAllAsRead);

  // Refresh Buttons
  refreshBtn?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    currentSearch = '';
    loadMessages();
    showToast('Inquiries refreshed from database.', 'info');
  });

  refreshDashboardBtn?.addEventListener('click', () => {
    loadMessages();
    showToast('Dashboard statistics refreshed.', 'info');
  });

  // ============================================================
  // ADMIN LOGOUT CONFIRMATION OVERLAY
  // ============================================================
  const logoutModal = document.getElementById('logoutConfirmModal');
  const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');
  const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');

  function openLogoutModal() {
    if (!logoutModal) {
      executeLogout();
      return;
    }
    if (confirmLogoutBtn) {
      confirmLogoutBtn.disabled = false;
      confirmLogoutBtn.innerHTML = '<i class="fa-solid fa-arrow-right-from-bracket" aria-hidden="true"></i> Yes, Sign Out';
    }
    logoutModal.classList.add('open');
    logoutModal.setAttribute('aria-hidden', 'false');
    cancelLogoutBtn?.focus();
  }

  function closeLogoutModal() {
    if (!logoutModal) return;
    logoutModal.classList.remove('open');
    logoutModal.setAttribute('aria-hidden', 'true');
  }

  async function executeLogout() {
    if (confirmLogoutBtn) {
      confirmLogoutBtn.disabled = true;
      confirmLogoutBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Signing out...';
    }
    try {
      await fetch('../api/admin-logout.php', { method: 'POST' });
    } catch (err) {
      console.warn('Logout API error:', err);
    } finally {
      try {
        localStorage.removeItem('admin_profile_cache');
      } catch (e) {}
      window.location.replace('login.html');
    }
  }

  logoutBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    openLogoutModal();
  });

  cancelLogoutBtn?.addEventListener('click', closeLogoutModal);
  confirmLogoutBtn?.addEventListener('click', executeLogout);

  logoutModal?.addEventListener('click', (e) => {
    if (e.target === logoutModal) {
      closeLogoutModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && logoutModal && logoutModal.classList.contains('open')) {
      closeLogoutModal();
    }
  });

  /* ============================================================
     TOAST NOTIFICATIONS
     ============================================================ */
  let toastTimer = null;
  function showToast(message, type = 'info') {
    if (!toast || !toastMessage) return;

    toastMessage.textContent = message;

    const icon = toast.querySelector('.toast-icon');
    if (icon) {
      if (type === 'error') {
        icon.className = 'fa-solid fa-circle-xmark toast-icon';
        toast.style.borderColor = 'rgba(239, 68, 68, 0.5)';
        toast.style.color = '#ef4444';
      } else if (type === 'success') {
        icon.className = 'fa-solid fa-circle-check toast-icon';
        toast.style.borderColor = 'rgba(16, 185, 129, 0.5)';
        toast.style.color = '#10b981';
      } else {
        icon.className = 'fa-solid fa-circle-info toast-icon';
        toast.style.borderColor = 'var(--border-hover)';
        toast.style.color = 'var(--accent-light)';
      }
    }

    toast.classList.add('show');

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 3800);
  }

  /* ============================================================
     DATE FORMATTING HELPER
     ============================================================ */
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

  /* ============================================================
     ADMIN PROFILE & APPEARANCE EDITOR (Experimental)
     ============================================================ */
  function initAdminProfileModal() {
    const openBtns = document.querySelectorAll('#openProfileModalBtn, #sidebarOpenProfileBtn, [data-open-profile-modal]');
    const modal = document.getElementById('adminProfileModal');
    const closeBtn = document.getElementById('closeProfileModalBtn');
    const cancelBtn = document.getElementById('cancelProfileModalBtn');
    const form = document.getElementById('adminProfileForm');
    const nameInput = document.getElementById('profileDisplayNameInput');
    const fileInput = document.getElementById('profileAvatarFileInput');
    const previewImg = document.getElementById('avatarPreviewImg');
    const previewInitials = document.getElementById('avatarPreviewInitials');
    const removeBtn = document.getElementById('removeAvatarBtn');
    const grid = document.getElementById('accentColorGrid');
    const resetBtn = document.getElementById('resetProfileDefaultsBtn');
    const saveBtn = document.getElementById('saveProfileBtn');
    const successNotice = document.getElementById('profileSuccessNotice');
    const errorNotice = document.getElementById('profileErrorNotice');
    const errorMsg = document.getElementById('profileErrorMsg');

    if (!modal) return;

    let selectedAccent = currentAdminProfile.accent_color || '#6c63ff';
    let clearAvatar = false;
    let selectedFile = null;

    const ACCENT_PRESETS = [
      { name: 'Violet', value: '#6c63ff' },
      { name: 'Ocean Blue', value: '#3b82f6' },
      { name: 'Teal', value: '#14b8a6' },
      { name: 'Emerald', value: '#10b981' },
      { name: 'Amber', value: '#f59e0b' },
      { name: 'Rose', value: '#ec4899' },
      { name: 'Indigo Purple', value: '#8b5cf6' },
      { name: 'Cyan', value: '#06b6d4' }
    ];

    function renderAccentGrid() {
      if (!grid) return;
      grid.innerHTML = '';
      ACCENT_PRESETS.forEach(preset => {
        const swatch = document.createElement('button');
        swatch.type = 'button';
        swatch.className = 'accent-swatch' + (preset.value.toLowerCase() === selectedAccent.toLowerCase() ? ' active' : '');
        swatch.style.backgroundColor = preset.value;
        swatch.style.color = preset.value;
        swatch.setAttribute('aria-label', preset.name + ' accent');
        swatch.title = preset.name;
        swatch.addEventListener('click', () => {
          selectedAccent = preset.value;
          renderAccentGrid();
          applyAccentColor(selectedAccent);
        });
        grid.appendChild(swatch);
      });
    }

    function syncAvatarPreview() {
      if (clearAvatar) {
        if (previewImg) previewImg.style.display = 'none';
        if (previewInitials) {
          previewInitials.style.display = 'inline';
          previewInitials.textContent = (nameInput?.value || currentAdminProfile.display_name || 'E').charAt(0).toUpperCase();
        }
      } else if (selectedFile) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (previewImg) {
            previewImg.src = e.target.result;
            previewImg.style.display = 'block';
          }
          if (previewInitials) previewInitials.style.display = 'none';
        };
        reader.readAsDataURL(selectedFile);
      } else if (currentAdminProfile.avatar_url) {
        if (previewImg) {
          previewImg.src = '../' + currentAdminProfile.avatar_url;
          previewImg.style.display = 'block';
        }
        if (previewInitials) previewInitials.style.display = 'none';
      } else {
        if (previewImg) previewImg.style.display = 'none';
        if (previewInitials) {
          previewInitials.style.display = 'inline';
          previewInitials.textContent = (nameInput?.value || currentAdminProfile.display_name || 'E').charAt(0).toUpperCase();
        }
      }
    }

    function openModal() {
      if (nameInput) nameInput.value = currentAdminProfile.display_name || 'Ethan';
      selectedAccent = currentAdminProfile.accent_color || '#6c63ff';
      clearAvatar = false;
      selectedFile = null;
      if (fileInput) fileInput.value = '';
      if (successNotice) successNotice.style.display = 'none';
      if (errorNotice) errorNotice.style.display = 'none';

      renderAccentGrid();
      syncAvatarPreview();

      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
      if (sidebarEl && sidebarEl.classList.contains('open')) {
        sidebarEl.classList.remove('open');
        if (sidebarOverlay) sidebarOverlay.classList.remove('visible');
      }
      nameInput?.focus();
    }

    function closeModal() {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
      // Revert accent preview to saved profile if cancelled
      applyAccentColor(currentAdminProfile.accent_color || '#6c63ff');
    }

    openBtns.forEach(btn => btn.addEventListener('click', openModal));
    // Click outside modal card on overlay background to close
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
    closeBtn?.addEventListener('click', closeModal);
    cancelBtn?.addEventListener('click', closeModal);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('open')) {
        closeModal();
      }
    });

    nameInput?.addEventListener('input', () => {
      if (!selectedFile && !currentAdminProfile.avatar_url) {
        if (previewInitials) {
          previewInitials.textContent = (nameInput.value || 'E').charAt(0).toUpperCase();
        }
      }
    });

    fileInput?.addEventListener('change', () => {
      if (fileInput.files && fileInput.files[0]) {
        const file = fileInput.files[0];
        if (file.size > 2 * 1024 * 1024) {
          if (errorMsg) errorMsg.textContent = 'Avatar file size must be less than 2MB.';
          if (errorNotice) errorNotice.style.display = 'flex';
          fileInput.value = '';
          return;
        }
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
          if (errorMsg) errorMsg.textContent = 'Only JPEG, PNG, or WebP images are allowed.';
          if (errorNotice) errorNotice.style.display = 'flex';
          fileInput.value = '';
          return;
        }
        selectedFile = file;
        clearAvatar = false;
        if (errorNotice) errorNotice.style.display = 'none';
        syncAvatarPreview();
      }
    });

    removeBtn?.addEventListener('click', () => {
      clearAvatar = true;
      selectedFile = null;
      if (fileInput) fileInput.value = '';
      syncAvatarPreview();
    });

    resetBtn?.addEventListener('click', async () => {
      if (!confirm('Reset profile display name, avatar, and accent color to defaults?')) return;
      if (resetBtn) resetBtn.disabled = true;

      try {
        const token = await ensureCsrfToken();
        const res = await fetch('../api/admin-profile.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-CSRF-Token': token
          },
          body: JSON.stringify({ action: 'reset', csrf_token: token })
        });

        const data = await res.json();
        if (res.ok && data.status === 'success') {
          currentAdminProfile = {
            username: currentAdminProfile.username || 'admin',
            display_name: 'Ethan',
            avatar_url: null,
            accent_color: '#6c63ff'
          };
          if (data.csrf_token) csrfToken = data.csrf_token;
          try {
            localStorage.setItem('admin_profile_cache', JSON.stringify(currentAdminProfile));
          } catch (e) {}
          applyAccentColor('#6c63ff');
          syncTopbarUser();
          closeModal();
          showToast('Profile reset to default settings.', 'success');
        } else {
          if (errorMsg) errorMsg.textContent = data.message || 'Could not reset profile.';
          if (errorNotice) errorNotice.style.display = 'flex';
        }
      } catch (err) {
        console.error('Reset profile error:', err);
        if (errorMsg) errorMsg.textContent = 'Server error during reset.';
        if (errorNotice) errorNotice.style.display = 'flex';
      } finally {
        if (resetBtn) resetBtn.disabled = false;
      }
    });

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (successNotice) successNotice.style.display = 'none';
      if (errorNotice) errorNotice.style.display = 'none';

      const dName = nameInput?.value.trim() || 'Ethan';
      if (!dName) {
        if (errorMsg) errorMsg.textContent = 'Please enter a valid display name.';
        if (errorNotice) errorNotice.style.display = 'flex';
        return;
      }

      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
      }

      try {
        const token = await ensureCsrfToken();
        const formData = new FormData();
        formData.append('display_name', dName);
        formData.append('accent_color', selectedAccent);
        formData.append('csrf_token', token);

        if (selectedFile) {
          formData.append('avatar', selectedFile);
        } else if (clearAvatar) {
          formData.append('clear_avatar', '1');
        }

        const res = await fetch('../api/admin-profile.php', {
          method: 'POST',
          headers: {
            'X-CSRF-Token': token
          },
          body: formData
        });

        const data = await res.json();
        if (res.ok && data.status === 'success') {
          currentAdminProfile = {
            username: data.profile.username || currentAdminProfile.username,
            display_name: data.profile.display_name || dName,
            avatar_url: data.profile.avatar_url || null,
            accent_color: data.profile.accent_color || selectedAccent
          };
          if (data.csrf_token) csrfToken = data.csrf_token;
          try {
            localStorage.setItem('admin_profile_cache', JSON.stringify(currentAdminProfile));
          } catch (e) {}

          applyAccentColor(currentAdminProfile.accent_color);
          syncTopbarUser();
          closeModal();
          showToast('Admin profile & appearance saved!', 'success');
        } else {
          if (errorMsg) errorMsg.textContent = data.message || 'Failed to save profile changes.';
          if (errorNotice) errorNotice.style.display = 'flex';
        }
      } catch (err) {
        console.error('Save profile error:', err);
        if (errorMsg) errorMsg.textContent = 'Connection error. Please try again.';
        if (errorNotice) errorNotice.style.display = 'flex';
      } finally {
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Changes';
        }
      }
    });
  }
}
