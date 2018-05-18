const RequireNoSession = new Error('Require no session');
const RequireSession = new Error('Require session');
const RequireAdmin = new Error('Require admin');

module.exports = {
  RequireNoSession,
  RequireSession,
  RequireAdmin
};
