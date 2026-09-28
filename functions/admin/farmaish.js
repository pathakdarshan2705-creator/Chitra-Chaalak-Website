// functions/admin/farmaish.js
// Private reading page for viewing viewer request letters (Farmaish).

export async function onRequestGet() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">
  <title>FARMAISH // INBOX [PRIVATE]</title>
  <style>
    :root {
      --navy: #00122e;
      --navy-card: #002b70;
      --blue-border: #67c8ff;
      --yellow: #fff000;
      --text: #a6e8ff;
      --danger: #ff4d4d;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--navy);
      color: var(--text);
      font-family: 'IBM Plex Mono', monospace, sans-serif;
      padding: 24px;
      line-height: 1.5;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 16px;
      border-bottom: 2px solid var(--blue-border);
      margin-bottom: 24px;
    }
    .title {
      font-size: 16px;
      font-weight: 700;
      color: var(--yellow);
      letter-spacing: 1.5px;
    }
    .auth-box {
      max-width: 400px;
      margin: 60px auto;
      background: var(--navy-card);
      border: 2px solid var(--blue-border);
      padding: 24px;
      border-radius: 4px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
    }
    .auth-title {
      font-size: 13px;
      font-weight: 700;
      color: var(--yellow);
      margin-bottom: 12px;
      letter-spacing: 1px;
    }
    .input-field {
      width: 100%;
      padding: 10px;
      background: #000c20;
      border: 1px solid var(--blue-border);
      color: var(--yellow);
      font-family: inherit;
      font-size: 13px;
      margin-bottom: 16px;
      outline: none;
    }
    .input-field:focus {
      border-color: var(--yellow);
    }
    .btn {
      padding: 8px 18px;
      background: var(--navy-card);
      color: var(--yellow);
      border: 1px solid var(--yellow);
      font-family: inherit;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 1px;
      cursor: pointer;
      text-transform: uppercase;
      transition: all 0.15s ease;
    }
    .btn:hover {
      background: var(--yellow);
      color: var(--navy);
    }
    .btn-danger {
      border-color: var(--danger);
      color: var(--danger);
      font-size: 10px;
      padding: 4px 10px;
    }
    .btn-danger:hover {
      background: var(--danger);
      color: #fff;
    }
    .msg-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .msg-card {
      background: var(--navy-card);
      border: 1px solid var(--blue-border);
      padding: 18px;
      border-radius: 2px;
      position: relative;
    }
    .msg-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      font-size: 11px;
      color: var(--blue-border);
      border-bottom: 1px dashed rgba(103, 200, 255, 0.3);
      padding-bottom: 6px;
    }
    .msg-author {
      color: var(--yellow);
      font-weight: 700;
    }
    .msg-content {
      font-size: 14px;
      color: #ffffff;
      white-space: pre-wrap;
      word-break: break-word;
      font-family: 'Rajdhani', sans-serif, monospace;
      font-weight: 500;
      line-height: 1.6;
    }
    .msg-actions {
      margin-top: 12px;
      display: flex;
      justify-content: flex-end;
    }
    .empty-state {
      text-align: center;
      padding: 48px;
      color: var(--blue-border);
      font-size: 13px;
    }
    .pagination {
      margin-top: 24px;
      display: flex;
      justify-content: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">[ FARMAISH // VIEWER REQUEST INBOX ]</div>
    <div id="auth-status" style="font-size: 11px;">SECURE ACCESS</div>
  </div>

  <div id="login-section" class="auth-box">
    <div class="auth-title">ENTER ACCESS TOKEN</div>
    <input type="password" id="admin-token-input" class="input-field" placeholder="Admin Token" autocomplete="off" />
    <button type="button" class="btn" id="login-btn">AUTHENTICATE</button>
  </div>

  <div id="inbox-section" style="display: none;">
    <div class="msg-list" id="msg-container"></div>
    <div class="pagination" id="pagination-controls" style="display: none;">
      <button type="button" class="btn" id="load-more-btn">LOAD MORE</button>
    </div>
  </div>

  <script>
    let currentToken = '';
    let nextCursor = null;

    const loginSection = document.getElementById('login-section');
    const inboxSection = document.getElementById('inbox-section');
    const tokenInput = document.getElementById('admin-token-input');
    const loginBtn = document.getElementById('login-btn');
    const msgContainer = document.getElementById('msg-container');
    const paginationControls = document.getElementById('pagination-controls');
    const loadMoreBtn = document.getElementById('load-more-btn');

    async function fetchMessages(append = false) {
      if (!currentToken) return;

      const url = '/api/farmaish-admin' + (nextCursor ? '?cursor=' + encodeURIComponent(nextCursor) : '');
      const res = await fetch(url, {
        headers: {
          'Authorization': 'Bearer ' + currentToken
        }
      });

      if (!res.ok) {
        alert('Authentication failed or invalid token.');
        currentToken = '';
        loginSection.style.display = 'block';
        inboxSection.style.display = 'none';
        return;
      }

      const data = await res.json();
      nextCursor = data.cursor;

      if (!append) {
        msgContainer.innerHTML = '';
      }

      if (!data.messages || data.messages.length === 0) {
        if (!append) {
          const empty = document.createElement('div');
          empty.className = 'empty-state';
          empty.textContent = '[ NO MESSAGES IN FARMAISH INBOX ]';
          msgContainer.appendChild(empty);
        }
      } else {
        data.messages.forEach(msg => {
          const card = document.createElement('div');
          card.className = 'msg-card';
          card.id = 'card-' + msg.id.replace(/[^a-zA-Z0-9_-]/g, '_');

          const meta = document.createElement('div');
          meta.className = 'msg-meta';

          const author = document.createElement('span');
          author.className = 'msg-author';
          author.textContent = 'FROM: ' + (msg.from || 'Anonymous');

          const date = document.createElement('span');
          const d = new Date(msg.createdAt);
          date.textContent = isNaN(d) ? msg.createdAt : d.toLocaleString('en-GB');

          meta.appendChild(author);
          meta.appendChild(date);
          card.appendChild(meta);

          // RENDER WITH textContent TO PREVENT XSS
          const content = document.createElement('div');
          content.className = 'msg-content';
          content.textContent = msg.message;
          card.appendChild(content);

          const actions = document.createElement('div');
          actions.className = 'msg-actions';

          const deleteBtn = document.createElement('button');
          deleteBtn.className = 'btn btn-danger';
          deleteBtn.textContent = 'DELETE';
          deleteBtn.onclick = async () => {
            if (!confirm('Permanently delete this message?')) return;
            const delRes = await fetch('/api/farmaish-admin', {
              method: 'DELETE',
              headers: {
                'Authorization': 'Bearer ' + currentToken,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ id: msg.id })
            });
            if (delRes.ok) {
              card.remove();
            } else {
              alert('Failed to delete message.');
            }
          };

          actions.appendChild(deleteBtn);
          card.appendChild(actions);

          msgContainer.appendChild(card);
        });
      }

      if (nextCursor) {
        paginationControls.style.display = 'flex';
      } else {
        paginationControls.style.display = 'none';
      }
    }

    loginBtn.addEventListener('click', () => {
      const val = tokenInput.value.trim();
      if (!val) return;
      currentToken = val;
      tokenInput.value = '';
      loginSection.style.display = 'none';
      inboxSection.style.display = 'block';
      fetchMessages(false);
    });

    tokenInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') loginBtn.click();
    });

    loadMoreBtn.addEventListener('click', () => {
      fetchMessages(true);
    });
  </script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Robots-Tag': 'noindex, nofollow',
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}
