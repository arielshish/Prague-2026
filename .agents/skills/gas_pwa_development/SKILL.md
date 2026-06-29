---
name: gas-pwa-development
description: Best practices for building and deploying Google Apps Script PWAs for iOS Safari
---

# Google Apps Script PWA Development for iOS Safari

When working on a Google Apps Script (GAS) project that serves as a PWA (single HTML file + Code.gs) for mobile users (especially iOS/Safari), strictly adhere to the following rules based on past debugging sessions.

## 1. Deployment (The `/exec` trap)
- `clasp push` ONLY pushes the code to the development environment (`/dev` or `/edit` URL). 
- If the user is testing the published web app using the `/exec` URL, **they will NOT see your changes** after a `clasp push`.
- **Rule:** ALWAYS run `npx @google/clasp deploy` after `clasp push` if the user is actively testing the live web app.

## 2. iOS Safari & Inline Event Handlers
- Using `event.currentTarget` in inline HTML event handlers (e.g. `<button onclick="myFunc()">`) will throw a `ReferenceError` on iOS Safari and completely halt execution.
- **Rule:** Always pass the event object explicitly in the HTML: 
  ```html
  <button onclick="myFunc(event, 'arg1')">Click</button>
  ```
  And define the JS function to accept it:
  ```javascript
  function myFunc(e, arg1) {
    const btn = e.currentTarget;
  }
  ```

## 3. On-Device Debugging
- Mobile browsers do not have a built-in DevTools console. If a syntax or runtime error occurs in `init()`, the app will simply fail silently and "no buttons will work".
- **Rule:** When debugging mobile PWA issues, inject a global `window.onerror` floating debug console so the user can send you a screenshot of the exact exception:
  ```javascript
  window.onerror = function(msg, url, line, col, error) {
    const dbg = document.getElementById('debug_overlay');
    if (dbg) {
      dbg.style.display = 'block';
      dbg.innerHTML += `<p style="color:red; font-size:12px;">ERR: ${msg} <br>L${line}:${col}</p>`;
    }
  };
  ```

## 4. Mobile Drag & Drop (SortableJS)
- Drag and drop can be unreliable or clunky on smaller iPhone screens.
- **Rule:** Always provide one-click alternative buttons (like `+ Add to Day` or `✕ Remove`) alongside Drag & Drop capabilities for much better mobile UX.

## 5. Bidirectional Sync & UI Feedback
- Background sync via `google.script.run` is silent. If the network drops or the server fails, the user won't know.
- **Rule:** Always implement UI indicators (e.g. "🔄 שומר...", "✅ נשמר", "⚠️ שגיאה") for every sync action.
- **Rule:** Always implement a `try { safeStorage.setItem(...) }` fallback to localStorage when loading/saving data fails, so the app remains usable offline.

## 6. Avoiding JS Duplication
- When using tools to edit the massive `<script>` block in `index.html`, be extremely careful not to duplicate function definitions.
- Duplicate functions cause unpredictable UI bugs where older definitions silently overwrite your new logic. Always verify changes using `grep_search` or terminal tools to ensure only one instance of a function exists.
