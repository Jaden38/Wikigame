let currentLinks = [];
let filteredLinks = [];
let currentPage = 0;
const linksPerPage = 20;
let targetUrl = ""; // To store the target URL

async function startGame(depart = null, cible = null) {
    let gameInfo;
    if (depart === null || cible === null) {
        gameInfo = await eel.start_game()(); // Call without parameters for random links
    } else {
        gameInfo = await eel.start_game(depart, cible)(); // Call with provided parameters
    }
    
    document.getElementById("start-title").innerText = decodeURIComponent(gameInfo.start_title.replace(/_/g, ' '));
    document.getElementById("end-title").innerText = decodeURIComponent(gameInfo.end_title.replace(/_/g, ' '));
    targetUrl = gameInfo.end_url; // Set the target URL
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
    document.getElementById("summary").innerText = pageInfo.summary;

    currentLinks = pageInfo.links;
    filteredLinks = currentLinks; // Initialize filteredLinks to currentLinks
    currentPage = 0; // Reset to first page on new load
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
        linksContainer.appendChild(linkElement);
    }
    updatePaginationInfo();
}

function filterLinks() {
    let query = document.getElementById("search-bar").value.toLowerCase();
    filteredLinks = currentLinks.filter(link => link[1].toLowerCase().includes(query));
    currentPage = 0; // Reset to first page on new search
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

window.onload = function() {
    startGame(); 
};
