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
  const thumbnailUrl = getThumbnailUrl(bookmark);
  const style = {
    width: (100 / columns) + '%',
  };
  let styleString = '';
  Object.keys(style).forEach((key) => {
    styleString += (key + ': ' + style[key]);
  });
  const textStyleString = `color: ${textColor}`;
  console.log(textStyleString);

  const bookmarkLink = html`<div class="bookmark" style="${styleString}">
    <a href="${bookmark.url}" style="${textStyleString}">
      <img src="${thumbnailUrl}" />
      <div>${bookmark.title}</div>
    </a>
  </div>`;
  return bookmarkLink;
}

function updateDial(folderId) {
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
      updateDial(e.currentTarget.dataset.folderId);
    });
    nav.appendChild(folderLink);
  });

  if (activeFolders.length > 0) {
    const firstFolder = activeFolders[0];
    updateDial(firstFolder.id);
  }
}

function speeddial() {
  const backgroundColor = JSON.parse(localStorage.getItem("background-color") || DEFAULT_SETTINGS['background-color']);
  const textColor = JSON.parse(localStorage.getItem("text-color") || DEFAULT_SETTINGS['text-color']);
  document.body.style.backgroundColor = backgroundColor;
  document.body.style.color = textColor;
  updateNav();
}

document.addEventListener("DOMContentLoaded", () => {
  if (window.location.pathname == "/speeddial.html") {
    speeddial();
  }
});
