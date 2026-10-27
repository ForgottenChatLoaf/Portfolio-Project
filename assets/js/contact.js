/**
 * Two-Step Contact Interaction & API Submission
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

  if (!step1Card || !step2Card) return;

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

    // Clear previous errors
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

  // Check initial state
  if (visitorName && visitorName.trim().length >= 2) {
    goToStep2(visitorName);
  } else {
    goToStep1();
  }

  // Step 1: Submit Name
  if (step1Form) {
    step1Form.addEventListener('submit', (e) => {
      e.preventDefault();
      clearErrors();

      const name = step1NameInput?.value.trim() || '';

      if (name.length < 2) {
        if (step1Error) step1Error.textContent = 'Please enter a name with at least 2 characters.';
        return;
      }

      goToStep2(name);
    });
  }

  // Step 2: Change Name option
  if (changeNameBtn) {
    changeNameBtn.addEventListener('click', () => {
      sessionStorage.removeItem('portfolio_visitor_name');
      goToStep1();
    });
  }

  // Step 2: Reset Button
  if (resetBtn && contactForm) {
    resetBtn.addEventListener('click', () => {
      contactForm.reset();
      clearErrors();
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

      let hasClientError = false;

      if (!email) {
        if (emailError) emailError.textContent = 'Please enter your email address.';
        hasClientError = true;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        if (emailError) emailError.textContent = 'Please enter a valid email address.';
        hasClientError = true;
      }

      if (!message) {
        if (messageError) messageError.textContent = 'Please enter your message.';
        hasClientError = true;
      } else if (message.length < 5) {
        if (messageError) messageError.textContent = 'Message must be at least 5 characters long.';
        hasClientError = true;
      }

      if (hasClientError) return;

      // Disable button & show spinner
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending Message...';
      }

      try {
        const payload = {
          name: visitorName,
          email: email,
          message: message
        };

        const res = await fetch('api/contact-submit.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (res.ok && data.status === 'success') {
          // Success
          contactForm.reset();
          if (formSuccess) {
            formSuccess.style.display = 'flex';
          }
          if (typeof window.showToast === 'function') {
            window.showToast('Message sent successfully! Thank you for reaching out.', 'success');
          }
        } else {
          // Display validation errors or error message
          const msg = data.message || 'Failed to send message. Please check the fields and try again.';
          if (formErrorMsg) formErrorMsg.textContent = msg;
          if (formError) formError.style.display = 'flex';

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
          formErrorMsg.textContent = 'Could not reach the backend server. Please verify XAMPP Apache and MySQL are running.';
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
