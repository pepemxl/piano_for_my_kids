(function () {
  function showError(form, message) {
    const el = form.querySelector('#error');
    if (!el) return;
    el.textContent = message;
    el.hidden = false;
  }

  async function submit(url, body, form) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showError(form, data.error || 'Something went wrong');
        return;
      }
      window.location.href = '/dashboard.html';
    } catch (err) {
      showError(form, 'Network error. Try again.');
    }
  }

  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(loginForm);
      submit('/api/auth/login', {
        username: fd.get('username'),
        password: fd.get('password')
      }, loginForm);
    });
  }

  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(signupForm);
      submit('/api/auth/signup', {
        username: fd.get('username'),
        displayName: fd.get('displayName'),
        password: fd.get('password')
      }, signupForm);
    });
  }
})();
