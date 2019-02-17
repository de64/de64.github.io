"""
This file contains script used to extract noun list from wiktionary.org, specifically from:
https://dumps.wikimedia.org/enwiktionary/latest/
You might need to use January 2019 version of Wiktioanry.
The file that this script operates on is xml file extracted from
enwiktionary-latest-pages-articles.xml.bz2.
"""

import mmap
import re

# location of the database dump
dump = '/home/iaroslav/Downloads/enw.xml'

page_pattern = re.compile(rb'<page>(.*?)</page>',
                          re.DOTALL | re.IGNORECASE | re.MULTILINE)

german_pattern = re.compile(rb'==German==(.*?)----',
                          re.DOTALL | re.IGNORECASE | re.MULTILINE)

word_pattern = re.compile('<title>(.*?)</title>',
                          re.DOTALL | re.IGNORECASE | re.MULTILINE)

word_stats_pattern = re.compile('de-noun(.*?)\}\}',
                          re.DOTALL | re.IGNORECASE | re.MULTILINE)

translation_pattern = re.compile('de-noun(.*?)\}\}(.+?)[-=<]',
                          re.DOTALL | re.IGNORECASE | re.MULTILINE)

nouns = {}
counter = 0

with open(dump, "r") as f:
    with mmap.mmap(f.fileno(), 0, access=mmap.ACCESS_READ) as m:
        for page_match in re.finditer(page_pattern, m):
            page = page_match.group(0)

            if rb'{{de-noun' not in page:
                continue

            page = page.decode('utf-8')

            try:
                word = word_pattern.findall(page)[0]
                descriptors = word_stats_pattern.findall(page)[0].split('|')
                gender = descriptors[1]

                word_meaning = translation_pattern.findall(page)

                word_meaning = word_meaning[0][-1]
                translation = word_meaning[1:].replace('#', '')

                nouns[word] = {
                    'gender': gender,
                    'translation': translation
                }

                counter += 1
                print(counter)

            except BaseException as ex:
                print(page)



import json
with open('de_nouns.json', 'w') as rf:
    json.dump(nouns, rf, indent=2, sort_keys=True)