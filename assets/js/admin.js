/**
 * Admin Panel Client Logic (Secured & Upgraded)
 * Handles Authentication, Real-time Dashboard, Custom Deletion Modal,
 * Message Inspector, Status Workflow, and Safe CSV Exports
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
  // DOM Elements
  const adminUserBadge = document.getElementById('adminUserBadge');
  const logoutBtn = document.getElementById('adminLogoutBtn');
  const refreshBtn = document.getElementById('refreshMessagesBtn');
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

  // 1. Verify authentication immediately
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
    if (statNew) statNew.textContent = stats.new ?? 0;
    if (statWeek) statWeek.textContent = stats.this_week ?? 0;
    if (statReplied) statReplied.textContent = stats.replied ?? 0;

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

    // Status Filter
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

      // Column 3: Sender Name & Email
      const tdSender = document.createElement('td');
      tdSender.className = 'td-sender';
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

      tdSender.appendChild(senderName);
      tdSender.appendChild(emailLink);

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

  // Refresh Button
  refreshBtn?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    currentSearch = '';
    loadMessages();
    showToast('Inquiries refreshed from database.', 'info');
  });

  // Logout Button
  logoutBtn?.addEventListener('click', async () => {
    try {
      await fetch('../api/admin-logout.php', { method: 'POST' });
    } catch (err) {
      console.warn('Logout API error:', err);
    } finally {
      window.location.replace('login.html');
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
}
