const fs = require('fs');
fetch('http://localhost:4321').then(r => r.text()).then(t => {
  const start = t.indexOf('<main class="cc-col cc-col--center"');
  const end = t.indexOf('<aside class="cc-col cc-col--portfolio"');
  console.log(t.substring(start, end));
});
