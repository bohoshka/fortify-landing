const smoothScroll = (target) => {
  const el = document.getElementById(target);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

document.addEventListener('click', (event) => {
  const waitlistTrigger = event.target.closest('[data-waitlist-source]');
  const form = document.getElementById('waitlist');
  if (waitlistTrigger && form) {
    const sourceInput = form.querySelector('input[name="source"]');
    if (sourceInput) {
      sourceInput.value = waitlistTrigger.getAttribute('data-waitlist-source');
    }
  }

  const anchor = event.target.closest('a[href^="#"]');
  if (!anchor) {
    return;
  }

  const id = anchor.getAttribute('href').slice(1);
  if (id) {
    event.preventDefault();
    smoothScroll(id);
  }
});

const waitlistForm = document.getElementById('waitlist');
const statusMessage = document.getElementById('waitlist-status');
const defaultStatusText = statusMessage ? statusMessage.textContent : '';

if (waitlistForm) {
  waitlistForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submitButton = waitlistForm.querySelector('button');
    const emailInput = waitlistForm.querySelector('input[name="email"]');
    const sourceInput = waitlistForm.querySelector('input[name="source"]');

    if (!emailInput || !emailInput.value) {
      if (statusMessage) {
        statusMessage.textContent = 'Please provide an email address to join the waitlist.';
      }
      return;
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Sending…';
    }

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailInput.value,
          source: sourceInput ? sourceInput.value : 'waitlist',
        }),
      });

      if (!response.ok) {
        throw new Error('Request failed');
      }

      waitlistForm.reset();
      if (sourceInput) {
        sourceInput.value = 'join_waitlist';
      }
      if (statusMessage) {
        statusMessage.textContent = 'Thanks! You\'re on the list — we\'ll be in touch soon.';
      }
      if (submitButton) {
        submitButton.textContent = 'Notified';
      }
    } catch (error) {
      if (statusMessage) {
        statusMessage.textContent = 'Sorry, something went wrong. Please try again in a moment.';
      }
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Notify me';
      }
      if (statusMessage && !statusMessage.textContent) {
        statusMessage.textContent = defaultStatusText;
      }
    }
  });
}
