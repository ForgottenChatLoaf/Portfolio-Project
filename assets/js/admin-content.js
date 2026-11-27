/**
 * Admin Portfolio Content Manager (Projects & Skills CRUD)
 * Reuses existing Admin authentication, CSRF tokens, and toast feedback.
 * Ethan McClarence Gacud Portfolio
 */

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('adminContentPage')) return;

  let csrfToken = '';
  let projectsList = [];
  let skillsList = [];
  let pendingDelete = null; // { type: 'project'|'skill', id: number, name: string }

  const esc = (str) => {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  function toast(msg, type = 'success') {
    const el = document.getElementById('adminToast');
    const txt = document.getElementById('toastMessage');
    if (!el || !txt) return;
    txt.textContent = msg;
    el.classList.remove('toast-success', 'toast-error');
    el.classList.add(type === 'error' ? 'toast-error' : 'toast-success', 'show');
    setTimeout(() => el.classList.remove('show'), 3200);
  }

  async function ensureCsrf() {
    if (csrfToken) return csrfToken;
    const res = await fetch('../api/csrf-token.php');
    const data = await res.json();
    if (data.csrf_token) csrfToken = data.csrf_token;
    return csrfToken;
  }

  function renderContentSkeleton(tbodyId, wrapId, emptyId, rows = 4) {
    const tbody = document.getElementById(tbodyId);
    const wrap = document.getElementById(wrapId);
    const empty = document.getElementById(emptyId);
    if (!tbody) return;
    if (empty) empty.style.display = 'none';
    if (wrap) wrap.style.display = 'block';
    tbody.innerHTML = Array.from({ length: rows }).map(() => `
      <tr aria-hidden="true">
        <td class="td-id"><span class="skeleton-block" style="width: 28px; height: 14px;"></span></td>
        <td><span class="skeleton-block skeleton-line-md" style="width: 140px;"></span></td>
        <td><span class="skeleton-block skeleton-pill"></span></td>
        <td class="td-preview"><span class="skeleton-block skeleton-line-md" style="width: 85%;"></span></td>
        <td class="td-actions">
          <div class="table-action-btns">
            <span class="skeleton-block skeleton-btn"></span>
            <span class="skeleton-block skeleton-btn"></span>
          </div>
        </td>
      </tr>
    `).join('');
  }

  // -------------------------------------------------------------
  // 1. Load Projects & Skills
  // -------------------------------------------------------------
  async function loadProjects() {
    renderContentSkeleton('projectsTableBody', 'projectsTableWrap', 'projectsEmptyState', 4);
    try {
      const res = await fetch('../api/admin-projects.php');
      if (res.status === 401) { window.location.replace('login.html'); return; }
      const data = await res.json();
      if (data.csrf_token) csrfToken = data.csrf_token;
      if (res.ok && data.status === 'success') {
        projectsList = data.projects || [];
        renderProjects();
      } else {
        throw new Error(data.message || 'Failed to load projects');
      }
    } catch (e) {
      const tbody = document.getElementById('projectsTableBody');
      if (tbody) tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 28px; color: var(--text-secondary);">Could not load projects. <button type="button" class="btn-outline btn-sm" id="retryProjBtn" style="margin-left:8px;">Retry</button></td></tr>`;
      document.getElementById('retryProjBtn')?.addEventListener('click', loadProjects);
    }
  }

  async function loadSkills() {
    renderContentSkeleton('skillsTableBody', 'skillsTableWrap', 'skillsEmptyState', 4);
    try {
      const res = await fetch('../api/admin-skills.php');
      if (res.status === 401) { window.location.replace('login.html'); return; }
      const data = await res.json();
      if (data.csrf_token) csrfToken = data.csrf_token;
      if (res.ok && data.status === 'success') {
        skillsList = data.skills || [];
        renderSkills();
      } else {
        throw new Error(data.message || 'Failed to load skills');
      }
    } catch (e) {
      const tbody = document.getElementById('skillsTableBody');
      if (tbody) tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 28px; color: var(--text-secondary);">Could not load skills. <button type="button" class="btn-outline btn-sm" id="retrySkillBtn" style="margin-left:8px;">Retry</button></td></tr>`;
      document.getElementById('retrySkillBtn')?.addEventListener('click', loadSkills);
    }
  }

  function renderProjects() {
    const empty = document.getElementById('projectsEmptyState');
    const wrap = document.getElementById('projectsTableWrap');
    const tbody = document.getElementById('projectsTableBody');
    if (!tbody) return;

    if (projectsList.length === 0) {
      if (empty) empty.style.display = 'block';
      if (wrap) wrap.style.display = 'none';
      return;
    }

    if (empty) empty.style.display = 'none';
    if (wrap) wrap.style.display = 'block';
    tbody.innerHTML = projectsList.map(p => `
      <tr>
        <td class="td-id">#${esc(p.display_order)}</td>
        <td><strong>${esc(p.title)}</strong></td>
        <td><span class="status-badge ${p.section_type === 'featured' ? 'status-new' : 'status-read'}">${esc(p.section_type === 'featured' ? 'Featured' : 'Side Quest')}</span></td>
        <td class="td-preview">${esc(p.tag)}</td>
        <td class="td-actions">
          <div class="table-action-btns">
            <button type="button" class="btn-inspect edit-proj-btn" data-id="${p.id}" title="Edit project"><i class="fa-solid fa-pen-to-square"></i></button>
            <button type="button" class="btn-delete del-proj-btn" data-id="${p.id}" title="Delete project"><i class="fa-solid fa-trash-can"></i></button>
          </div>
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('.edit-proj-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const proj = projectsList.find(x => Number(x.id) === Number(btn.dataset.id));
        if (proj) openProjectModal(proj);
      });
    });

    tbody.querySelectorAll('.del-proj-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const proj = projectsList.find(x => Number(x.id) === Number(btn.dataset.id));
        if (proj) openDeleteConfirm('project', proj.id, proj.title);
      });
    });
  }

  function renderSkills() {
    const empty = document.getElementById('skillsEmptyState');
    const wrap = document.getElementById('skillsTableWrap');
    const tbody = document.getElementById('skillsTableBody');
    if (!tbody) return;

    if (skillsList.length === 0) {
      if (empty) empty.style.display = 'block';
      if (wrap) wrap.style.display = 'none';
      return;
    }

    if (empty) empty.style.display = 'none';
    if (wrap) wrap.style.display = 'block';
    tbody.innerHTML = skillsList.map(s => `
      <tr>
        <td class="td-id">#${esc(s.display_order)}</td>
        <td><strong>${esc(s.name)}</strong></td>
        <td><span class="status-badge status-read">${esc(s.category_title)}</span></td>
        <td class="td-preview">${esc(s.subtitle)}</td>
        <td class="td-actions">
          <div class="table-action-btns">
            <button type="button" class="btn-inspect edit-skill-btn" data-id="${s.id}" title="Edit skill"><i class="fa-solid fa-pen-to-square"></i></button>
            <button type="button" class="btn-delete del-skill-btn" data-id="${s.id}" title="Delete skill"><i class="fa-solid fa-trash-can"></i></button>
          </div>
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('.edit-skill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const sk = skillsList.find(x => Number(x.id) === Number(btn.dataset.id));
        if (sk) openSkillModal(sk);
      });
    });

    tbody.querySelectorAll('.del-skill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const sk = skillsList.find(x => Number(x.id) === Number(btn.dataset.id));
        if (sk) openDeleteConfirm('skill', sk.id, sk.name);
      });
    });
  }

  // -------------------------------------------------------------
  // 2. Project Modal Create / Update
  // -------------------------------------------------------------
  const projModal = document.getElementById('projectFormModal');
  const projForm = document.getElementById('projectCrudForm');

  function openProjectModal(proj = null) {
    document.getElementById('projectFormTitle').textContent = proj ? `Edit Project: ${proj.title}` : 'Add Project';
    document.getElementById('projIdInput').value = proj ? proj.id : '';
    document.getElementById('projTitleInput').value = proj ? proj.title : '';
    document.getElementById('projSectionInput').value = proj ? proj.section_type : 'featured';
    document.getElementById('projTagInput').value = proj ? proj.tag : '';
    document.getElementById('projOrderInput').value = proj ? proj.display_order : 1;
    document.getElementById('projDescInput').value = proj ? proj.description : '';
    document.getElementById('projRoleInput').value = proj?.role || '';
    document.getElementById('projTimelineInput').value = proj?.timeline || '';
    document.getElementById('projTechInput').value = proj?.tech_stack || '';
    document.getElementById('projPrimaryUrlInput').value = proj?.primary_url || '';
    document.getElementById('projPrimaryLabelInput').value = proj?.primary_label || '';
    document.getElementById('projImagesInput').value = (proj?.images || []).join('\n');

    projModal.classList.add('open');
    projModal.setAttribute('aria-hidden', 'false');
  }

  function closeProjectModal() {
    projModal.classList.remove('open');
    projModal.setAttribute('aria-hidden', 'true');
  }

  document.getElementById('addProjectBtn')?.addEventListener('click', () => openProjectModal(null));
  document.getElementById('closeProjectFormBtn')?.addEventListener('click', closeProjectModal);
  document.getElementById('cancelProjectFormBtn')?.addEventListener('click', closeProjectModal);

  projForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('projIdInput').value;
    const isEdit = Boolean(id);
    const token = await ensureCsrf();

    const payload = {
      id: id ? Number(id) : undefined,
      title: document.getElementById('projTitleInput').value.trim(),
      section_type: document.getElementById('projSectionInput').value,
      tag: document.getElementById('projTagInput').value.trim(),
      display_order: Number(document.getElementById('projOrderInput').value) || 0,
      description: document.getElementById('projDescInput').value.trim(),
      role: document.getElementById('projRoleInput').value.trim(),
      timeline: document.getElementById('projTimelineInput').value.trim(),
      tech_stack: document.getElementById('projTechInput').value.trim(),
      primary_url: document.getElementById('projPrimaryUrlInput').value.trim(),
      primary_label: document.getElementById('projPrimaryLabelInput').value.trim(),
      images: document.getElementById('projImagesInput').value.trim(),
      csrf_token: token
    };

    const res = await fetch('../api/admin-projects.php', {
      method: isEdit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (res.ok && data.status === 'success') {
      closeProjectModal();
      toast(data.message || 'Project saved.');
      loadProjects();
    } else {
      toast(data.message || 'Failed to save project.', 'error');
    }
  });

  // -------------------------------------------------------------
  // 3. Skill Modal Create / Update
  // -------------------------------------------------------------
  const skillModal = document.getElementById('skillFormModal');
  const skillForm = document.getElementById('skillCrudForm');

  function openSkillModal(sk = null) {
    document.getElementById('skillFormTitle').textContent = sk ? `Edit Skill: ${sk.name}` : 'Add Skill';
    document.getElementById('skillIdInput').value = sk ? sk.id : '';
    document.getElementById('skillCategoryInput').value = sk ? sk.category_key : 'frontend';
    document.getElementById('skillOrderInput').value = sk ? sk.display_order : 1;
    document.getElementById('skillNameInput').value = sk ? sk.name : '';
    document.getElementById('skillSubtitleInput').value = sk ? sk.subtitle : '';
    document.getElementById('skillDetailsInput').value = sk ? sk.details : '';
    document.getElementById('skillIconInput').value = sk?.icon_url || '';

    skillModal.classList.add('open');
    skillModal.setAttribute('aria-hidden', 'false');
  }

  function closeSkillModal() {
    skillModal.classList.remove('open');
    skillModal.setAttribute('aria-hidden', 'true');
  }

  document.getElementById('addSkillBtn')?.addEventListener('click', () => openSkillModal(null));
  document.getElementById('closeSkillFormBtn')?.addEventListener('click', closeSkillModal);
  document.getElementById('cancelSkillFormBtn')?.addEventListener('click', closeSkillModal);

  skillForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('skillIdInput').value;
    const isEdit = Boolean(id);
    const token = await ensureCsrf();

    const payload = {
      id: id ? Number(id) : undefined,
      category_key: document.getElementById('skillCategoryInput').value,
      display_order: Number(document.getElementById('skillOrderInput').value) || 0,
      name: document.getElementById('skillNameInput').value.trim(),
      subtitle: document.getElementById('skillSubtitleInput').value.trim(),
      details: document.getElementById('skillDetailsInput').value.trim(),
      icon_url: document.getElementById('skillIconInput').value.trim(),
      csrf_token: token
    };

    const res = await fetch('../api/admin-skills.php', {
      method: isEdit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (res.ok && data.status === 'success') {
      closeSkillModal();
      toast(data.message || 'Skill saved.');
      loadSkills();
    } else {
      toast(data.message || 'Failed to save skill.', 'error');
    }
  });

  // -------------------------------------------------------------
  // 4. Delete Confirmation
  // -------------------------------------------------------------
  const delModal = document.getElementById('deleteContentModal');

  function openDeleteConfirm(type, id, name) {
    pendingDelete = { type, id, name };
    document.getElementById('deleteContentDesc').textContent = `Are you sure you want to delete "${name}"? This action cannot be undone.`;
    delModal.classList.add('open');
    delModal.setAttribute('aria-hidden', 'false');
  }

  function closeDeleteConfirm() {
    pendingDelete = null;
    delModal.classList.remove('open');
    delModal.setAttribute('aria-hidden', 'true');
  }

  document.getElementById('cancelDeleteContentBtn')?.addEventListener('click', closeDeleteConfirm);
  document.getElementById('confirmDeleteContentBtn')?.addEventListener('click', async () => {
    if (!pendingDelete) return;
    const token = await ensureCsrf();
    const endpoint = pendingDelete.type === 'project' ? '../api/admin-projects.php' : '../api/admin-skills.php';

    const res = await fetch(endpoint, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token },
      body: JSON.stringify({ id: pendingDelete.id, csrf_token: token })
    });
    const data = await res.json();
    if (res.ok && data.status === 'success') {
      toast(data.message || 'Deleted successfully.');
      const t = pendingDelete.type;
      closeDeleteConfirm();
      if (t === 'project') loadProjects();
      else loadSkills();
    } else {
      toast(data.message || 'Delete failed.', 'error');
    }
  });

  // Initial load
  loadProjects();
  loadSkills();
});
