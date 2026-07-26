(function () {
  var USERS = {
    harjas: { name: "Harjas", password: "1234" },
    ikjot: { name: "Ikjot", password: "0611" }
  };
  var STORAGE_KEY = "budget-app-user";

  function currentUserId() {
    var id = localStorage.getItem(STORAGE_KEY);
    return USERS[id] ? id : null;
  }

  var userId = currentUserId();
  var onLoginPage = /(^|\/)login\.html$/.test(location.pathname);

  if (onLoginPage) {
    if (userId) location.replace("index.html");
  } else if (!userId) {
    var page = location.pathname.split("/").pop() || "index.html";
    location.replace("login.html?redirect=" + encodeURIComponent(page));
  }

  window.BudgetAuth = {
    USERS: USERS,
    STORAGE_KEY: STORAGE_KEY,
    user: userId,
    userName: userId ? USERS[userId].name : null,
    logout: function () {
      localStorage.removeItem(STORAGE_KEY);
      location.href = "login.html";
    }
  };
})();
