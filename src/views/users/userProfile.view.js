(function registerUserProfileView(global) {
  const { App } = global;
  const { formatProfileDateTime } = App.utils.formatters;

  function renderProfileToolbar(profile) {
    return `
      <div class="drawer__toolbar">
        <button
          type="button"
          class="drawer__action-btn drawer__action-btn--danger"
          data-profile-action="delete-user"
          data-user-id="${profile.id}"
        >Видалити користувача</button>
      </div>
    `;
  }

  function renderProfileSections(profile) {
    const nickname = profile.nickname || "Без нікнейму";
    const avatar = profile.avatarUrl
      ? `<img src="${profile.avatarUrl}" alt="${nickname}" class="profile-avatar profile-avatar--image" />`
      : `<div class="profile-avatar profile-avatar--fallback">${nickname.slice(0, 1).toUpperCase()}</div>`;

    const inventoryHtml = profile.inventory.length
      ? profile.inventory.map((item) => `<li class="profile-list-item">${item.productName} x${item.quantity}</li>`).join("")
      : '<li class="profile-list-item profile-list-item--empty">Інвентар порожній</li>';

    const formatChatCount = (value) =>
      value === null || value === undefined ? "—" : String(value);
    const privateChatsDisplay = formatChatCount(profile.chatCounts?.private);
    const groupChatsDisplay = formatChatCount(profile.chatCounts?.group);

    return `
      <div class="profile-section profile-section--user">
        <h3 class="profile-section-title">Картка користувача</h3>
        <div class="profile-user">
          ${avatar}
          <div class="profile-field-list profile-user-info">
            <div class="profile-field-row">
              <span class="profile-field-label">Нікнейм</span>
              <span class="profile-field-value">${nickname}</span>
            </div>
            <div class="profile-field-row">
              <span class="profile-field-label">Ім'я</span>
              <span class="profile-field-value">${profile.name || "Не вказано"}</span>
            </div>
            <div class="profile-field-row">
              <span class="profile-field-label">Телефон</span>
              <span class="profile-field-value">${profile.mobile || "Не вказано"}</span>
            </div>
            <div class="profile-field-row">
              <span class="profile-field-label">Дата реєстрації</span>
              <span class="profile-field-value profile-field-value--datetime">${formatProfileDateTime(profile.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="profile-section">
        <h3 class="profile-section-title">Чати</h3>
        <div class="profile-field-list">
          <div class="profile-field-row">
            <span class="profile-field-label">Приватні</span>
            <span class="profile-field-value">${privateChatsDisplay}</span>
          </div>
          <div class="profile-field-row">
            <span class="profile-field-label">Групові</span>
            <span class="profile-field-value">${groupChatsDisplay}</span>
          </div>
        </div>
      </div>
      <div class="profile-section">
        <h3 class="profile-section-title">Фінанси</h3>
        <div class="profile-field-list">
          <div class="profile-field-row">
            <span class="profile-field-label">Баланс</span>
            <span class="profile-field-value profile-balance">${profile.wallet.balance}</span>
          </div>
        </div>
      </div>
      <div class="profile-section">
        <h3 class="profile-section-title">Інвентар</h3>
        <ul class="profile-list">${inventoryHtml}</ul>
      </div>
    `;
  }

  function renderProfileSections(profile) {
    const nickname = profile.nickname || "Без нікнейму";
    const avatar = profile.avatarUrl
      ? `<img src="${profile.avatarUrl}" alt="${nickname}" class="profile-avatar profile-avatar--image" />`
      : `<div class="profile-avatar profile-avatar--fallback">${nickname.slice(0, 1).toUpperCase()}</div>`;

    const inventoryHtml = profile.inventory.length
      ? profile.inventory.map((item) => `<li class="profile-list-item">${item.productName} x${item.quantity}</li>`).join("")
      : '<li class="profile-list-item profile-list-item--empty">Інвентар порожній</li>';

    const formatChatCount = (value) =>
      value === null || value === undefined ? "—" : String(value);
    const privateChatsDisplay = formatChatCount(profile.chatCounts?.private);
    const groupChatsDisplay = formatChatCount(profile.chatCounts?.group);

    return `
      <div class="profile-section profile-section--user">
        <h3 class="profile-section-title">Картка користувача</h3>
        <div class="profile-user">
          ${avatar}
          <div class="profile-field-list profile-user-info">
            <div class="profile-field-row">
              <span class="profile-field-label">Нікнейм</span>
              <span class="profile-field-value">${nickname}</span>
            </div>
            <div class="profile-field-row">
              <span class="profile-field-label">Ім'я</span>
              <span class="profile-field-value">${profile.name || "Не вказано"}</span>
            </div>
            <div class="profile-field-row">
              <span class="profile-field-label">Телефон</span>
              <span class="profile-field-value">${profile.mobile || "Не вказано"}</span>
            </div>
            <div class="profile-field-row">
              <span class="profile-field-label">Дата реєстрації</span>
              <span class="profile-field-value profile-field-value--datetime">${formatProfileDateTime(profile.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="profile-section">
        <h3 class="profile-section-title">Чати</h3>
        <div class="profile-field-list">
          <div class="profile-field-row">
            <span class="profile-field-label">Приватні</span>
            <span class="profile-field-value">${privateChatsDisplay}</span>
          </div>
          <div class="profile-field-row">
            <span class="profile-field-label">Групові</span>
            <span class="profile-field-value">${groupChatsDisplay}</span>
          </div>
        </div>
      </div>
      <div class="profile-section">
        <h3 class="profile-section-title">Фінанси</h3>
        <div class="profile-field-list">
          <div class="profile-field-row">
            <span class="profile-field-label">Баланс</span>
            <span class="profile-field-value profile-balance">${profile.wallet.balance}</span>
          </div>
        </div>
      </div>
      <div class="profile-section">
        <h3 class="profile-section-title">Інвентар</h3>
        <ul class="profile-list">${inventoryHtml}</ul>
      </div>
    `;
  }

  function renderProfileContent(profile) {
    return `${renderProfileToolbar(profile)}${renderProfileSections(profile)}`;
  }


  function renderProfileContent(profile) {
    return renderProfileToolbar(profile) + renderProfileSections(profile);
  }

  App.views.users.profile = {
    renderProfileToolbar,
    renderProfileSections,
    renderProfileContent,
  };
})(window);
