let currentLinks = [];
let filteredLinks = [];
let currentPage = 0;
const linksPerPage = 20;
let targetUrl = "";
let hoverTimeout = null;

window.onload = function() {
    startGame();
    if (localStorage.getItem('dark-mode') === 'enabled') {
        document.body.classList.add('dark-mode');
    }
}

async function startGame(depart = null, cible = null) {
    let gameInfo;
    if (depart === null || cible === null) {
        gameInfo = await eel.start_game()();
    } else {
        gameInfo = await eel.start_game(depart, cible)();
    }
    
    document.getElementById("start-title").innerText = decodeURIComponent(gameInfo.start_title.replace(/_/g, ' '));
    document.getElementById("end-title").innerText = decodeURIComponent(gameInfo.end_title.replace(/_/g, ' '));
    targetUrl = gameInfo.end_url;
    loadPage(gameInfo.start_url);
}

async function loadPage(url) {
    if (url === targetUrl) {
        document.getElementById("current-title").innerText = "Vous avez atteint la cible!";
        document.getElementById("summary").innerText = "Félicitations! Vous avez atteint la page cible.";
        document.getElementById("links-container").innerHTML = "";
        document.getElementById("total-links").innerText = "";
        document.getElementById("page-info").innerText = "";
        return;
    }

    let pageInfo = await eel.get_page_info(url)();
    document.getElementById("current-title").innerText = decodeURIComponent(pageInfo.current_title.replace(/_/g, ' '));
    document.getElementById("summary").innerHTML = pageInfo.summary;
    document.getElementById("summary").setAttribute("data-current-summary", pageInfo.summary);

    currentLinks = pageInfo.links;
    filteredLinks = currentLinks;
    currentPage = 0;
    displayLinks();
}

function displayLinks() {
    let linksContainer = document.getElementById("links-container");
    linksContainer.innerHTML = "";
    let start = currentPage * linksPerPage;
    let end = Math.min(start + linksPerPage, filteredLinks.length);

    for (let i = start; i < end; i++) {
        let linkElement = document.createElement("div");
        linkElement.innerText = `${i + 1} - ${decodeURIComponent(filteredLinks[i][1].replace(/_/g, ' '))}`;
        linkElement.onclick = () => loadPage(filteredLinks[i][0]);
        linkElement.onmouseover = () => debounceHover(() => showLinkSummary(filteredLinks[i][0], filteredLinks[i][1]));
        linkElement.onmouseout = () => resetSummary();
        linksContainer.appendChild(linkElement);
    }
    updatePaginationInfo();
}

function debounceHover(callback) {
    if (hoverTimeout) {
        clearTimeout(hoverTimeout);
    }
    hoverTimeout = setTimeout(callback, 300);
}

async function showLinkSummary(url, linkText) {
    if (hoverTimeout) {
        clearTimeout(hoverTimeout);
    }

    try {
        let pageInfo = await eel.get_page_info(url)();
        if (pageInfo && pageInfo.summary) {
            document.getElementById("summary").innerHTML = `<span class="summary-of">Summary of ${decodeURIComponent(linkText.replace(/_/g, ' '))}:</span> ${pageInfo.summary}`;
        }
    } catch (err) {
        console.error('Failed to fetch link summary', err);
    }
}

function resetSummary() {
    if (hoverTimeout) {
        clearTimeout(hoverTimeout);
    }
    let currentSummary = document.getElementById("summary").getAttribute("data-current-summary");
    document.getElementById("summary").innerHTML = currentSummary;
}

function filterLinks() {
    let query = document.getElementById("search-bar").value.toLowerCase();
    filteredLinks = currentLinks.filter(link => link[1].toLowerCase().includes(query));
    currentPage = 0;
    displayLinks();
}

function updatePaginationInfo() {
    let totalLinks = filteredLinks.length;
    let totalPages = Math.ceil(totalLinks / linksPerPage);
    document.getElementById("total-links").innerText = `Total Links: ${totalLinks}`;
    document.getElementById("page-info").innerText = `Page: ${currentPage + 1} / ${totalPages}`;
    updateButtons();
}

function updateButtons() {
    document.getElementById("next").disabled = (currentPage + 1) * linksPerPage >= filteredLinks.length;
    document.getElementById("prev").disabled = currentPage === 0;
}

document.getElementById("next").onclick = function() {
    if ((currentPage + 1) * linksPerPage < filteredLinks.length) {
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

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('dark-mode', 'enabled');
    } else {
        localStorage.setItem('dark-mode', 'disabled');
    }
}
