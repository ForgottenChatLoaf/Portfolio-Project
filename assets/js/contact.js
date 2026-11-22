/**
 * Two-Step Contact Interaction & API Submission (Hardened & Reconstructed)
 * Ethan McClarence Gacud Portfolio
 */

document.addEventListener('DOMContentLoaded', () => {
  initContactWorkflow();
});

function initContactWorkflow() {
  const step1Card = document.getElementById('contactStep1');
  const step2Card = document.getElementById('contactStep2');
  const step1Form = document.getElementById('step1Form');
  const step1NameInput = document.getElementById('step1Name');
  const step1Error = document.getElementById('step1Error');
  const step1NextBtn = document.getElementById('step1NextBtn');
  const welcomeNameDisplay = document.getElementById('welcomeVisitorName');
  const changeNameBtn = document.getElementById('changeNameBtn');
  const contactForm = document.getElementById('contactForm');
  const emailInput = document.getElementById('contactEmail');
  const messageInput = document.getElementById('contactMessage');
  const submitBtn = document.getElementById('contactSubmitBtn');
  const resetBtn = document.getElementById('contactResetBtn');
  const formSuccess = document.getElementById('formSuccess');
  const formError = document.getElementById('formError');
  const formErrorMsg = document.getElementById('formErrorMsg');
  const emailError = document.getElementById('emailError');
  const messageError = document.getElementById('messageError');
  const honeypotInput = document.getElementById('contactHoneypot');
  const csrfTokenInput = document.getElementById('contactCsrfToken');

  if (!step1Card || !step2Card) return;

  const formLoadedTime = Date.now();
  let currentCsrfToken = '';

  // Fetch CSRF token proactively from backend
  fetchCsrfToken();

  async function fetchCsrfToken() {
    try {
      const csrfEndpoint = (window.location.protocol === 'file:')
        ? 'http://localhost/PortfolioUpdate/Portfolio-Project/api/csrf-token.php'
        : 'api/csrf-token.php';

      const res = await fetch(csrfEndpoint);
      if (res.ok) {
        const data = await res.json();
        if (data.csrf_token) {
          currentCsrfToken = data.csrf_token;
          if (csrfTokenInput) csrfTokenInput.value = data.csrf_token;
        }
      }
    } catch (e) {
      console.warn('CSRF token initialization deferred:', e);
    }
  }

  // Restore saved name from sessionStorage if present
  let visitorName = sessionStorage.getItem('portfolio_visitor_name') || '';

  function goToStep1() {
    step1Card.style.display = 'block';
    step2Card.style.display = 'none';
    if (step1NameInput) {
      step1NameInput.value = visitorName;
      setTimeout(() => step1NameInput.focus(), 150);
    }
  }

  function goToStep2(name) {
    visitorName = name;
    sessionStorage.setItem('portfolio_visitor_name', name);

    if (welcomeNameDisplay) {
      // Use textContent for secure rendering to prevent XSS
      welcomeNameDisplay.textContent = name;
    }

    step1Card.style.display = 'none';
    step2Card.style.display = 'block';

    clearErrors();

    if (emailInput && !emailInput.value) {
      setTimeout(() => emailInput.focus(), 150);
    }
  }

  function clearErrors() {
    if (step1Error) step1Error.textContent = '';
    if (emailError) emailError.textContent = '';
    if (messageError) messageError.textContent = '';
    if (formError) formError.style.display = 'none';
  }

  // Initial step determination
  if (visitorName) {
    goToStep2(visitorName);
  } else {
    goToStep1();
  }

  // Step 1: Name Form Submission with Strict Validation
  if (step1Form) {
    step1Form.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearErrors();

      const name = step1NameInput?.value.trim() || '';

      if (!name) {
        if (step1Error) step1Error.textContent = 'Please enter your full name.';
        return;
      }

      if (name.length < 2) {
        if (step1Error) step1Error.textContent = 'Name must be at least 2 characters long.';
        return;
      }

      if (name.length > 100) {
        if (step1Error) step1Error.textContent = 'Name cannot exceed 100 characters.';
        return;
      }

      // Reject numeric-only or names containing digits
      if (/\d/.test(name)) {
        if (step1Error) step1Error.textContent = 'Name must not contain numbers or digits (e.g. use "Ethan" not "Ethan123").';
        return;
      }

      // Allow international letters, spaces, hyphens, and apostrophes
      if (!/^[\p{L}\s'’-]+$/u.test(name)) {
        if (step1Error) step1Error.textContent = 'Name contains invalid characters. Use letters, spaces, hyphens, or apostrophes.';
        return;
      }

      // Submit to backend Step 1 endpoint for server session binding
      if (step1NextBtn) {
        step1NextBtn.disabled = true;
        step1NextBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Checking...';
      }

      try {
        const step1Endpoint = (window.location.protocol === 'file:')
          ? 'http://localhost/PortfolioUpdate/Portfolio-Project/api/contact-step1.php'
          : 'api/contact-step1.php';

        const res = await fetch(step1Endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ name })
        });

        const data = await res.json();

        if (res.ok && data.status === 'success') {
          if (data.csrf_token) {
            currentCsrfToken = data.csrf_token;
            if (csrfTokenInput) csrfTokenInput.value = data.csrf_token;
          }
          goToStep2(data.name || name);
        } else {
          if (step1Error) {
            step1Error.textContent = data.message || 'Invalid name. Please try again.';
          }
        }
      } catch (err) {
        console.warn('Step 1 server check fallback to client validation:', err);
        goToStep2(name);
      } finally {
        if (step1NextBtn) {
          step1NextBtn.disabled = false;
          step1NextBtn.innerHTML = 'Continue to Message <i class="fa-solid fa-arrow-right"></i>';
        }
      }
    });
  }

  // "Change Name" button
  if (changeNameBtn) {
    changeNameBtn.addEventListener('click', () => {
      goToStep1();
    });
  }

  // Live Character Counter
  const charCountDisplay = document.getElementById('charCount');
  const charCounterWrap = document.querySelector('.char-counter-wrap');

  if (messageInput && charCountDisplay) {
    const updateCharCount = () => {
      const len = messageInput.value.length;
      charCountDisplay.textContent = len.toLocaleString();
      if (charCounterWrap) {
        if (len > 1900) {
          charCounterWrap.classList.add('limit-near');
        } else {
          charCounterWrap.classList.remove('limit-near');
        }
        if (len >= 2000) {
          charCounterWrap.classList.add('limit-exceeded');
        } else {
          charCounterWrap.classList.remove('limit-exceeded');
        }
      }
    };

    messageInput.addEventListener('input', updateCharCount);
    updateCharCount();
  }

  // Reset button
  if (resetBtn && contactForm) {
    resetBtn.addEventListener('click', () => {
      contactForm.reset();
      clearErrors();
      if (charCountDisplay) charCountDisplay.textContent = '0';
      if (charCounterWrap) charCounterWrap.classList.remove('limit-near', 'limit-exceeded');
      if (formSuccess) formSuccess.style.display = 'none';
    });
  }

  // Step 2: Submit Contact Message
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearErrors();
      if (formSuccess) formSuccess.style.display = 'none';

      const email = emailInput?.value.trim() || '';
      const message = messageInput?.value.trim() || '';
      const honeypot = honeypotInput?.value || '';

      let hasClientError = false;

      // Email validation
      if (!email) {
        if (emailError) emailError.textContent = 'Please enter your email address.';
        hasClientError = true;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        if (emailError) emailError.textContent = 'Please enter a valid email address.';
        hasClientError = true;
      } else {
        const domain = email.substring(email.lastIndexOf('@') + 1).toLowerCase();
        const reservedDomains = ['example.com', 'example.org', 'example.net', 'invalid', 'localhost', 'test'];
        if (reservedDomains.includes(domain)) {
          if (emailError) emailError.textContent = 'Please provide a real email address, not a reserved example domain.';
          hasClientError = true;
        }
      }

      // Message validation
      if (!message) {
        if (messageError) messageError.textContent = 'Please enter your message.';
        hasClientError = true;
      } else if (message.length < 5) {
        if (messageError) messageError.textContent = 'Message must be at least 5 characters long.';
        hasClientError = true;
      } else if (message.length > 2000) {
        if (messageError) messageError.textContent = 'Your message is too long (maximum 2,000 characters).';
        hasClientError = true;
      }

      if (hasClientError) return;

      // Disable button & show spinner
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...';
      }

      try {
        const payload = {
          name: visitorName,
          email: email,
          message: message,
          website_url: honeypot,
          form_loaded_at: formLoadedTime,
          csrf_token: currentCsrfToken || (csrfTokenInput?.value || '')
        };

        const endpointUrl = (window.location.protocol === 'file:')
          ? 'http://localhost/PortfolioUpdate/Portfolio-Project/api/contact-submit.php'
          : 'api/contact-submit.php';

        const res = await fetch(endpointUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-CSRF-Token': payload.csrf_token
          },
          body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (res.ok && data.status === 'success') {
          // Success
          contactForm.reset();
          if (charCountDisplay) charCountDisplay.textContent = '0';
          if (charCounterWrap) charCounterWrap.classList.remove('limit-near', 'limit-exceeded');
          if (formSuccess) {
            formSuccess.style.display = 'flex';
            formSuccess.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
          if (typeof window.showToast === 'function') {
            window.showToast('Message sent successfully! Thank you for reaching out.', 'success');
          }
          // Refresh CSRF token for any subsequent submission
          if (data.csrf_token) {
            currentCsrfToken = data.csrf_token;
            if (csrfTokenInput) csrfTokenInput.value = data.csrf_token;
          } else {
            fetchCsrfToken();
          }
        } else {
          // Display validation errors or rate-limit notice
          const msg = data.message || 'Failed to send message. Please check the fields and try again.';
          if (formErrorMsg) formErrorMsg.textContent = msg;
          if (formError) {
            formError.style.display = 'flex';
            formError.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }

          if (data.errors) {
            if (data.errors.name && step1Error) {
              step1Error.textContent = data.errors.name;
              goToStep1();
            }
            if (data.errors.email && emailError) emailError.textContent = data.errors.email;
            if (data.errors.message && messageError) messageError.textContent = data.errors.message;
          }
        }
      } catch (err) {
        console.error('Contact submit error:', err);
        if (formErrorMsg) {
          formErrorMsg.textContent = "We couldn't submit your message right now. Please verify Apache and MySQL are running.";
        }
        if (formError) formError.style.display = 'flex';
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = 'Send Message <i class="fa-solid fa-paper-plane"></i>';
        }
      }
    });
  }
}
