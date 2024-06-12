import requests
from bs4 import BeautifulSoup
import os
import webbrowser

def get_random_wikipedia_url():
    url = "https://fr.wikipedia.org/wiki/Sp%C3%A9cial:Page_au_hasard"
    response = requests.get(url)
    soup = BeautifulSoup(response.content, 'html.parser')
    title = soup.find('h1').text
    return response.url, title


def get_links(url):
    response = requests.get(url)
    soup = BeautifulSoup(response.content, 'html.parser')
    
    # Tentative de trouver la div principale contenant le contenu de l'article
    content = soup.find('div', class_='mw-parser-output')
    if not content:
        # Si la div spécifique n'est pas trouvée, rechercher la première div qui pourrait contenir le texte principal
        content = soup.find('div', id='content')
        if not content:
            content = soup.find('div', role='main')
            if not content:
                return []  # Si aucun contenu approprié n'est trouvé, retourne une liste vide

    links = content.find_all('a', href=True)
    unique_links = {}
    for link in links:
        href = link.get('href', '')
        if href.startswith('/wiki/') and ':' not in href and not href.startswith('/wiki/Special:'):
            full_url = 'https://fr.wikipedia.org' + href
            if full_url not in unique_links:
                unique_links[full_url] = link.text.strip()
    return list(unique_links.items())




def play_game(depart=None, cible=None):
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

    current_url = start_url
    current_title = start_title
    steps = 0
    page = 0

    while current_title != end_title:
        os.system('cls' if os.name == 'nt' else 'clear')
        print("************************ WikiGame ************************" )
        print("************************ Tour ", steps + 1 ," ************************")
        print("Départ:", start_title)
        print("Cible:", end_title)
        print("Actuellement:", current_title)

        links = get_links(current_url)
        total_links = len(links)
        total_pages = (total_links - 1) // 20 + 1
        page_links = links[page * 20:(page + 1) * 20]
        
        print(f"Liens disponibles: {total_links}")

        for i, (url, text) in enumerate(page_links):
            print(f"{i + 1 + page * 20} - {text}")

        if page > 0:
            print("98 - Page précédente")
        if (page + 1) < total_pages:
            print("99 - Page suivante")

        choice = input("Votre choix : ")
        if choice == '99' and (page + 1) < total_pages:
            page += 1
        elif choice == '98' and page > 0:
            page -= 1
        elif choice.isdigit():
            index = int(choice) - 1
            if 0 <= index - page * 20 < len(page_links):
                current_url = page_links[index - page * 20][0]
                current_title = page_links[index - page * 20][1]
                steps += 1
                page = 0 
        else:
            print("Choix invalide.")

    print("Gagné en", steps, "coups!")
    webbrowser.open(current_url)

play_game(depart="France", cible="Louis-Philippe Ier")
# play_game()