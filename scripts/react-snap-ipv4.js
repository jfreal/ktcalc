// react-snap's prerender server calls `server.listen(port)` with no host, so Node
// binds IPv6 `::`. On current GitHub-hosted runners that bind fails immediately:
//   Error: listen EADDRINUSE: address already in use :::45678
// The same image and Node version still built main on 2026-11-06, and the port is
// not held by another step in this job. Binding 127.0.0.1 avoids the `::` listen.
// react-snap then crawls http://localhost:<port>, which is that address.
const http = require('http');

const listen = http.Server.prototype.listen;
http.Server.prototype.listen = function (port, hostname, ...rest) {
  if (typeof port === 'number' && (hostname === undefined || typeof hostname === 'function')) {
    const callback = typeof hostname === 'function' ? hostname : undefined;
    if (callback) return listen.call(this, port, '127.0.0.1', callback, ...rest);
    return listen.call(this, port, '127.0.0.1', ...rest);
  }
  return listen.call(this, port, hostname, ...rest);
};

require('react-snap/run.js');
