"""
Generates list of links for 1000+ articles of news in German, scraped from
spiegel.de. 
[Future] Optionally, the texts of the articles can be added to
the list, e.g. for any kind of advanced analysis.
"""

import requests
import re
from tqdm import tqdm

news_channels = [
    '/gesundheit/diagnose/',
    '/gesundheit/ernaehrung/',
    '/gesundheit/psychologie/',
    '/gesundheit/sex/',
    '/gesundheit/schwangerschaft/',
    '/lebenundlernen/job/',
    '/reise/deutschland/',
    '/reise/europa/',
    '/thema/stil_design/',
    '/thema/stil_kochen/',
    '/thema/versicherung/',
    '/thema/young_money/',
    '/einestages/thema/zeitzeugen/',
    '/wissenschaft/mensch/',
    '/wissenschaft/natur/',
    '/wissenschaft/technik/',
    '/wissenschaft/weltall/',
    '/wissenschaft/medizin/',
    '/netzwelt/netzpolitik/',
    '/netzwelt/web/',
    '/netzwelt/gadgets/',
    '/thema/datenschutz/',
    '/kultur/kino/',
    '/kultur/musik/',
    '/panorama/gesellschaft/',
    '/panorama/leute/',
    '/panorama/justiz/',
    '/wirtschaft/service/',
    '/wirtschaft/unternehmen/',
    '/wirtschaft/soziales/',
    '/politik/deutschland/',
    '/politik/ausland/'
]


def scrape(channel, max_depth):
    result = {}
    base = 'http://spiegel.de'
    page = base + channel

    for i in range(max_depth):
        response = requests.get(page)
        contents = response.content.decode('utf-8')
        regex = r'href="(' + channel.replace('/', '\/') + '.*?)".*?title="(.*?)"'
        
        for url, title in re.findall(regex, contents):
            url = base + url
            result[url] = {
                'title': title,
                'channel': channel,
            }
        
        results = re.findall('href="(.*?)".*?class="link-right"', contents)

        if not results:
            break
        
        page = base + results[0]
    
    return result

complete_urls = {}

for channel in tqdm(news_channels):
    channel_urls = scrape(channel, 10)
    complete_urls.update(channel_urls)

# convert to list of items
results = []
for url, stats in complete_urls.items():
    stats['url'] = url
    results.append(stats)

import json

json.dump(
    results, 
    open('spiegel_news.json', 'w'),
    indent=2,
    sort_keys=True
)