import requests
from bs4 import BeautifulSoup
import eel
import os

eel.init('web')

def get_random_wikipedia_url():
    url = "https://fr.wikipedia.org/wiki/Sp%C3%A9cial:Page_au_hasard"
    response = requests.get(url)
    soup = BeautifulSoup(response.content, 'html.parser')
    title = soup.find('h1').text
    return response.url, title

def should_exclude_link(href, text, link_classes):
    if not href.startswith('/wiki/'):
        return True
    if ':' in href:
        return True
    if href.startswith('/wiki/Special:'):
        return True
    if 'modifier' in text.lower():
        return True
    if 'article' in text.lower():
        return True
    if 'lire' in text.lower():
        return True
    if 'external text' in link_classes:
        return True
    return False

def get_links(url):
    response = requests.get(url)
    soup = BeautifulSoup(response.content, 'html.parser')
    links = soup.find_all('a', href=True)
    unique_links = {}
    for link in links:
        href = link.get('href', '')
        text = link.text.strip()
        link_classes = link.get('class', [])
        if should_exclude_link(href, text, link_classes):
            continue
        full_url = 'https://fr.wikipedia.org' + href
        if full_url not in unique_links:
            unique_links[full_url] = text
    return list(unique_links.items())

def get_first_paragraph(url):
    response = requests.get(url)
    soup = BeautifulSoup(response.content, 'html.parser')
    content_div = soup.find('div', {'class': 'mw-content-ltr mw-parser-output'})
    if content_div:
        for child in content_div.children:
            if child.name == 'p' and child.text.strip():
                text = child.text.strip()
                if len(text) > 50:
                    return text
    return "Pas de résumé disponible."

@eel.expose
def start_game(depart=None, cible=None):
    if depart is None:
        start_url, start_title = get_random_wikipedia_url()
    else:
        start_url = f"https://fr.wikipedia.org/wiki/{depart}"
        start_title = depart

    if cible is None:
        end_url, end_title = get_random_wikipedia_url()
    else:
        end_url = f"https://fr.wikipedia.org/wiki/{cible}"
        end_title = cible

    return {"start_url": start_url, "start_title": start_title, "end_url": end_url, "end_title": end_title}

@eel.expose
def get_page_info(current_url):
    current_title = current_url.split('/')[-1]
    summary = get_first_paragraph(current_url)
    links = get_links(current_url)
    return {"current_title": current_title, "summary": summary, "links": links}

eel.start('index.html', mode=None, host='localhost', port=8000)