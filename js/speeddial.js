const { html: { node: html } } = lighterhtml;

function getThumbnailUrl(bookmark) {
  const urlHash = btoa(bookmark.url);
  const thumbnails = JSON.parse(localStorage.getItem('thumbnails') || '{}');
  const thumbnail = thumbnails[urlHash];
  if (thumbnail && thumbnail.data.length > 0) {
    return thumbnail.data;
  }
  return 'img/nopreviewavailable.png';
}


function generateActiveFolderLink(activeFolder) {
  const textColor = JSON.parse(localStorage.getItem('text-color') || DEFAULT_SETTINGS['text-color']);
  const styleString = `color: ${textColor}`;
  const folderLink = html`<a href="#" data-folder-id="${activeFolder.id}" style="${styleString}">
    ${activeFolder.label}
  </a>`;
  return folderLink;
}

function generateBookmarkLink(bookmark) {
  const textColor = JSON.parse(localStorage.getItem('text-color') || DEFAULT_SETTINGS['text-color']);
  const columns = parseInt(JSON.parse(localStorage.getItem('columns') || '4'), 10);
  const minWidth = parseInt(JSON.parse(localStorage.getItem('thumbnail-min-width') || '0'), 10);
  const thumbnailUrl = getThumbnailUrl(bookmark);
  const style = {
    width: (100 / columns) + '%',
    'min-width': minWidth + 'px',
  };
  let styleString = '';
  Object.keys(style).forEach((key) => {
    styleString += (key + ': ' + style[key] + ';');
  });
  const textStyleString = `color: ${textColor}`;

  const bookmarkLink = html`<div class="bookmark" style="${styleString}">
    <a href="${bookmark.url}" style="${textStyleString}">
      <img src="${thumbnailUrl}" />
      <div>${bookmark.title}</div>
    </a>
  </div>`;
  return bookmarkLink;
}

function updateDial(folderId) {
  const textColor = JSON.parse(localStorage.getItem('text-color') || DEFAULT_SETTINGS['text-color']);
  const speeddial = document.querySelector('.speeddial');
  while (speeddial.hasChildNodes()) {
    speeddial.removeChild(speeddial.firstChild);
  }

  chrome.bookmarks.getSubTree(folderId, function(subTree) {
    const bookmarksDataset = JSON.parse(localStorage.getItem('thumbnails') || '{}');
    const baseNode = subTree[0];

    baseNode.children.forEach((node) => {
      // this has a url so store a slot for it in the thumbnails
      const urlHash = btoa(node.url);
      if (bookmarksDataset[urlHash] === undefined) {
        bookmarksDataset[urlHash] = {
          data: "",
          updated: 0,
        }
      }

      const bookmarkLink = generateBookmarkLink(node);
      speeddial.appendChild(bookmarkLink);
    });

    localStorage.setItem('thumbnails', JSON.stringify(bookmarksDataset));
  });

  localStorage.setItem('last-accessed-folder', folderId);
  const navItems = document.querySelectorAll('nav a');
  navItems.forEach((navItem) => {
    if (navItem.dataset.folderId === folderId) {
      navItem.classList.add('active');
      navItem.style.borderBottom = `1px solid ${textColor}`;
    } else {
      navItem.classList.remove('active');
      navItem.style.borderBottom = '';
    }
  });
}

function updateNav() {
  const nav = document.querySelector('nav');
  while (nav.hasChildNodes()) {
    nav.removeChild(nav.firstChild);
  }

  const activeFolders = JSON.parse(localStorage.getItem('active-folders') || '[]')
  activeFolders.forEach((folder) => {
    const folderLink = generateActiveFolderLink(folder);
    folderLink.addEventListener('click', (e) => {
      e.preventDefault();
      updateDial(e.currentTarget.dataset.folderId);
    });
    nav.appendChild(folderLink);
  });
  const lastFolderId = localStorage.getItem('last-accessed-folder');
  if (!lastFolderId) {
    if (activeFolders.length > 0) {
      const firstFolder = activeFolders[0];
      updateDial(firstFolder.id);
    }
  } else {
    updateDial(lastFolderId);
  }
}

function showOmnibarThing() {
  let addressbar = document.querySelector('.addressbar');
  addressbar.style.display = 'block';

  let input = addressbar.querySelector('input');
  if (input.value === '') {
    input.value = 'http://';
  }
  input.focus();
  input.selectionStart = input.selectionEnd = input.value.length;
}

function hideOmnibarThing() {
  let addressbar = document.querySelector('.addressbar');
  addressbar.style.display = 'none';
}

function speeddial() {
  const backgroundColor = JSON.parse(localStorage.getItem("background-color") || DEFAULT_SETTINGS['background-color']);
  const textColor = JSON.parse(localStorage.getItem("text-color") || DEFAULT_SETTINGS['text-color']);
  document.body.style.backgroundColor = backgroundColor;
  document.body.style.color = textColor;
  updateNav();

  let addressbar = document.querySelector('.addressbar');
  let input = addressbar.querySelector('input');

  // also because sometimes fullscreen
  document.body.addEventListener('keypress', (e) => {
    if (e.target != input) {
      if (e.charCode === 111) {
        e.preventDefault();
        showOmnibarThing();
      }
    } else {
      if (e.charCode === 13) {
        if (input.value.indexOf('http') === 0) {
          window.location = input.value;
        } else {
          window.location = `https://google.com/search?q=${input.value}`;
        }
        hideOmnibarThing();
      }
    }
  });
  input.addEventListener('blur', hideOmnibarThing);
}

document.addEventListener("DOMContentLoaded", () => {
  if (window.location.pathname == "/speeddial.html") {
    speeddial();
    setTimeout(() => document.body.focus(), 500);
  }
});
