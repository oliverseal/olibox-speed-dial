const { html: { node: html } } = lighterhtml;

// these should be in the "serialized" form.
const DEFAULT_SETTINGS = {
  'columns': 4,
  'background-color': '"#ffffff"',
  'text-color': '"#000000"',
  'active-folders': "",
  'thumbnail-refresh-rate': 86400,
  'thumbnail-min-width': 250,
};


function getSettings() {
  const settings = {};
  const settingsKeys = Object.keys(DEFAULT_SETTINGS);
  settingsKeys.forEach((key) => {
    settings[key] = localStorage.getItem(key) || DEFAULT_SETTINGS[key];
  });
  return settings;
}

function saveSettings() {
  let validations = validateSettings();
  if (validations.length) {
    return validations;
  }
  const settingsFields = document.querySelectorAll('.setting-value'); 
  settingsFields.forEach((field) => {
    localStorage.setItem(field.name, translateToSetting(field));
  });

  updateSettings();
}

function validateSettings() {
  const settingsFields = document.querySelectorAll('.setting-value'); 
  const validations = [];

  return validations;
}

function translateToSetting(field) {
  switch(field.name) {
    case 'active-folders':
      // it's stored in the field as JSON already.
      return field.value;
    case 'column':
    case 'thumbnail-refresh-rate':
    case 'thumbnail-min-width':
      return parseInt(field.value, 10);
    default:
      return JSON.stringify(field.value);
  }
}

function translateFromSetting(key, value) {
  switch (key) {
    case 'active-folders':
      try {
        return JSON.stringify(JSON.parse(value));
      } catch {
        return value;
      }
    default:
      return JSON.parse(value || DEFAULT_SETTINGS[key] || '""');
  }
}

function updateSettings() {
  let savedSettings = getSettings();
  const settingsKeys = Object.keys(savedSettings);
  settingsKeys.forEach((key) => {
    let field = document.querySelector(`.setting-value[name="${key}"]`);
    if (field) {
      field.value = translateFromSetting(key, savedSettings[key]);
    }
  });
}

function onBookmarkFolderChange() {
  const field = document.querySelector('.setting-value[name="active-folders"]');
  if (field) {
    const checkboxes = document.querySelectorAll('.active-folders-list-checkbox-input');
    const selectedFolders = [...checkboxes].filter(checkbox => checkbox.checked).map(checkbox => ({
      id: checkbox.value,
      label: checkbox.dataset.label,
    }));
    field.value = JSON.stringify(selectedFolders);
    saveSettings();
  }
}

function generateBookmarkCheckbox(bookmark, parentNode) {
  const activeFolders = JSON.parse(localStorage.getItem('active-folders') || '[]');
  const activeFolderIds = activeFolders.map(f => f.id);
  const label = parentNode ? parentNode.title + ' - ' + bookmark.title : bookmark.title;
  const checkboxLabel = html`
    <label class="active-folders-list-checkbox">
      <span class="active-folders-list-checkbox-text">${bookmark.title}</span>
      <input
        class="active-folders-list-checkbox-input"
        type="checkbox"
        value="${bookmark.id}"
        checked="${activeFolderIds.includes(bookmark.id)}"
        data-label="${label}"
        onChange=${onBookmarkFolderChange}></input>
    </label>
  `;
  return checkboxLabel;
};

function generateBookmarksSelector() {
  const activeFoldersList = document.querySelector('.active-folders-list');
  if (activeFoldersList) {
    chrome.bookmarks.getTree((root) => {
      // Never more than 2 root nodes, push both Bookmarks Bar & Other Bookmarks into array
      const bookmarksBar = root[0].children[0];
      const otherBookmarks = root[0].children[1];

      [bookmarksBar, otherBookmarks].forEach((baseNode) => {
        baseNode.children.forEach((node) => {
          if (node.children !== undefined) {
            const folder = generateBookmarkCheckbox(node);
            activeFoldersList.appendChild(folder);
            node.children.forEach((child) => {
              if (child.children !== undefined) {
                const folder = generateBookmarkCheckbox(child, node);
                folder.classList.add('active-folders-list-checkbox-child');
                activeFoldersList.appendChild(folder);
              }
            });
          }
        });
      });
    });
  }
}

function settings() {
  generateBookmarksSelector();
  updateSettings();

  const settingsFields = document.querySelectorAll('.setting-value'); 
  settingsFields.forEach((field) => {
    field.addEventListener('change', saveSettings);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname == '/settings.html') {
    settings();
  }
});
