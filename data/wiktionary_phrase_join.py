"""
This script should be run after `wiktionary_nouns_extract.py`. This allows to merge the nouns
from wiktionary with words in `phrases_150k.json`, thus obtaining most popular nouns and
excluding ones which are very rare.
"""

import json
from tqdm import tqdm

# load and count all words
phrases = json.load(open('/home/iaroslav/learn-german/data/phrases_150k.json', 'r'))

# count word occurances
word_counts = {}
for phrase_params in tqdm(phrases):
    for phrase in phrase_params:
        for word in phrase:
            word = word.lower()

            if word not in word_counts:
                word_counts[word] = 0
            word_counts[word] += 1

# load the extracted nouns
nouns = json.load(open('german_nouns.json', 'r'))
nouns = {k.lower(): v for k, v in nouns.items()}

present = {}

for noun in tqdm(nouns):
    noun = noun.lower()

    if noun in word_counts:
        present[noun] = nouns[noun]
        present[noun]['count'] = word_counts[noun]


present = [{'noun': k.capitalize(), **v} for k, v in present.items()]
present.sort(reverse=True, key=lambda v: v['count'])
json.dump(present, open('de_frequent_nouns.json', 'w'), indent=2, sort_keys=True)

print('Total words: %s' % len(present))