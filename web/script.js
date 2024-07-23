let currentLinks = [];
let filteredLinks = [];
let currentPage = 0;
const linksPerPage = 20;
let targetUrl = "";
let hoverTimeout = null;
let startTime;
let linkClicks = 0;
let pseudo;
let pageLoading = false;

function initializeGame() {
    pseudo = localStorage.getItem('pseudo');
    if (!pseudo) {
        if (window.location.pathname.endsWith("game.html")) {
            alert("Pseudo not found. Returning to the menu.");
            window.location.href = "index.html";
        }
        return;
    }

    if (document.getElementById("start-title")) { // Check if we are on the game page
        startTime = Date.now();
        document.getElementById('start-time').value = startTime;
        linkClicks = -1; // Set to -1 so the first load doesn't count as a click
        startGame("France", "Suriname");
    }
    if (localStorage.getItem('dark-mode') === 'enabled') {
        document.body.classList.add('dark-mode');
    }

    const menuButton = document.querySelector(".menu-button");
    if (menuButton) {
        menuButton.onclick = function() {
            window.location.href = "index.html";
        };
    }

    const nextButton = document.getElementById("next");
    if (nextButton) {
        nextButton.onclick = function() {
            if ((currentPage + 1) * linksPerPage < filteredLinks.length) {
                currentPage++;
                displayLinks();
            }
        };
    }

    const prevButton = document.getElementById("prev");
    if (prevButton) {
        prevButton.onclick = function() {
            if (currentPage > 0) {
                currentPage--;
                displayLinks();
            }
        };
    }

    // Initialize jump counter display
    document.getElementById('jump-count').innerText = 0;
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
    if (pageLoading) return; // Prevent multiple increments
    pageLoading = true;

    if (linkClicks >= 0) { // Don't count the initial load as a click
        linkClicks++;
        document.getElementById('link-clicks').value = linkClicks;

        // Update the jump counter display
        document.getElementById('jump-count').innerText = linkClicks;
    } else {
        linkClicks = 0; // Set to 0 after the first load
    }

    if (url === targetUrl) {
        document.getElementById("current-title").innerText = "Vous avez atteint la cible!";
        document.getElementById("summary").innerText = "Félicitations! Vous avez atteint la page cible.";
        document.getElementById("links-container").innerHTML = "";
        document.getElementById("total-links").innerText = "";
        document.getElementById("page-info").innerText = "";

        recordScore();
        triggerConfetti();
        pageLoading = false;
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

    pageLoading = false; // Allow new increments after the page is fully loaded
}

function triggerConfetti() {
    const duration = 15 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
            return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);

        // since particles fall down, start a bit higher than random
        confetti(
            Object.assign({}, defaults, {
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
            })
        );
        confetti(
            Object.assign({}, defaults, {
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
            })
        );
    }, 250);
}

function debounceHover(callback, delay) {
    if (hoverTimeout) {
        clearTimeout(hoverTimeout);
    }
    hoverTimeout = setTimeout(callback, delay);
}

async function showLinkSummary(url, linkText) {
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

function displayLinks() {
    let linksContainer = document.getElementById("links-container");
    if (!linksContainer) return;
    linksContainer.innerHTML = "";
    let start = currentPage * linksPerPage;
    let end = Math.min(start + linksPerPage, filteredLinks.length);

    for (let i = start; i < end; i++) {
        let linkElement = document.createElement("div");
        linkElement.innerText = `${i + 1} - ${decodeURIComponent(filteredLinks[i][1].replace(/_/g, ' '))}`;
        linkElement.onclick = () => loadPage(filteredLinks[i][0]);
        linkElement.onmouseover = () => debounceHover(() => showLinkSummary(filteredLinks[i][0], filteredLinks[i][1]), 300);
        linkElement.onmouseout = resetSummary;
        linksContainer.appendChild(linkElement);
    }
    updatePaginationInfo();
}

function updatePaginationInfo() {
    let totalLinks = filteredLinks.length;
    let totalPages = Math.ceil(totalLinks / linksPerPage);
    document.getElementById("total-links").innerText = `Total Links: ${totalLinks}`;
    document.getElementById("page-info").innerText = `Page: ${currentPage + 1} / ${totalPages}`;
    updateButtons();
}

function updateButtons() {
    const nextButton = document.getElementById("next");
    const prevButton = document.getElementById("prev");
    if (nextButton) {
        nextButton.disabled = (currentPage + 1) * linksPerPage >= filteredLinks.length;
    }
    if (prevButton) {
        prevButton.disabled = currentPage === 0;
    }
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('dark-mode', 'enabled');
    } else {
        localStorage.setItem('dark-mode', 'disabled');
    }
}

function recordScore() {
    const endTime = Date.now();
    const timePassed = (endTime - startTime) / 1000;
    const clicks = linkClicks;
    const score = calculateScore(timePassed, clicks);

    let leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];
    
    // Check if the new score should be added
    if (leaderboard.length < 10 || score > leaderboard[leaderboard.length - 1].score) {
        leaderboard.push({ pseudo, score });
        leaderboard = leaderboard.filter(entry => entry.score !== null); // Remove entries with null scores

        // Remove duplicate pseudos, keeping the highest score
        leaderboard = leaderboard.reduce((acc, current) => {
            const existing = acc.find(entry => entry.pseudo === current.pseudo);
            if (!existing || existing.score < current.score) {
                acc = acc.filter(entry => entry.pseudo !== current.pseudo);
                acc.push(current);
            }
            return acc;
        }, []);

        leaderboard.sort((a, b) => b.score - a.score); // Sort leaderboard by score descending
        if (leaderboard.length > 10) {
            leaderboard = leaderboard.slice(0, 10); // Ensure only top 10 scores are kept
        }
        localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
    }
}

function calculateScore(timePassed, clicks) {
    const baseScore = 10000;
    const timePenalty = Math.exp(timePassed / 1000); // Exponential decay for time
    const clickPenalty = clicks * 100; // Linear penalty for clicks
    return Math.max(0, baseScore - timePenalty - clickPenalty);
}

window.addEventListener('load', initializeGame);
