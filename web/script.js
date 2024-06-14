let currentLinks = [];
let currentPage = 0;
const linksPerPage = 20;

async function startGame() {
    let gameInfo = await eel.start_game()();
    console.log(gameInfo);  // Debug
    document.getElementById("start-title").innerText = decodeURIComponent(gameInfo.start_title.replace(/_/g, ' '));
    document.getElementById("end-title").innerText = decodeURIComponent(gameInfo.end_title.replace(/_/g, ' '));
    loadPage(gameInfo.start_url);
}

async function loadPage(url) {
    let pageInfo = await eel.get_page_info(url)();
    console.log(pageInfo);  // Debug
    document.getElementById("current-title").innerText = decodeURIComponent(pageInfo.current_title.replace(/_/g, ' '));
    document.getElementById("summary").innerText = pageInfo.summary;

    currentLinks = pageInfo.links;
    currentPage = 0; // Reset to first page on new load
    displayLinks();
}

function displayLinks() {
    let linksContainer = document.getElementById("links-container");
    linksContainer.innerHTML = "";
    let start = currentPage * linksPerPage;
    let end = Math.min(start + linksPerPage, currentLinks.length);

    for (let i = start; i < end; i++) {
        let linkElement = document.createElement("div");
        linkElement.innerText = `${i + 1} - ${decodeURIComponent(currentLinks[i][1].replace(/_/g, ' '))}`;
        linkElement.onclick = () => loadPage(currentLinks[i][0]);
        linksContainer.appendChild(linkElement);
    }
    updatePaginationInfo();
}

function updatePaginationInfo() {
    let totalLinks = currentLinks.length;
    let totalPages = Math.ceil(totalLinks / linksPerPage);
    document.getElementById("total-links").innerText = `Total Links: ${totalLinks}`;
    document.getElementById("page-info").innerText = `Page: ${currentPage + 1} / ${totalPages}`;
    updateButtons();
}

function updateButtons() {
    document.getElementById("next").disabled = (currentPage + 1) * linksPerPage >= currentLinks.length;
    document.getElementById("prev").disabled = currentPage === 0;
}

document.getElementById("next").onclick = function() {
    if ((currentPage + 1) * linksPerPage < currentLinks.length) {
        currentPage++;
        displayLinks();
    }
};

document.getElementById("prev").onclick = function() {
    if (currentPage > 0) {
        currentPage--;
        displayLinks();
    }
};

window.onload = startGame;
