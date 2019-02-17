"""
Estimate gender of German noun word through a set of rules.
This script tests how accurate the rules are. Source:
https://www.fluentin3months.com/german-noun-genders/
"""

import json
from collections import OrderedDict


def all_nouns():
    data = json.load(open('de_nouns.json', 'r'))
    data = [(k, v['gender']) for k, v in data.items()]
    return data


def freq_nouns(top=10000):
    # loads shortened list of 7k nouns which occur often
    data = json.load(open('de_frequent_nouns.json', 'r'))
    data = data[:top]
    data = [(v['noun'], v['gender']) for v in data]
    return data


rules = {
    "f": ['e', 'it', 'ng', 'nz', 'on', 'ft', 'rin'],
    "m": ['nn', 'r', 'll', 'ag', 'f', 'tz', 'ang'],
    "n": ['en', 'aus', 'rn']
}

"""
rules = {
    "f": ['e', 'g', 'it', 'ei', 'ät', 'nz', 'on', 'ik', 'ft', 'rin'],
    "m": ['nn', 'r', 'ss', 'll', 'nd', 'ag', 'f', 'tz', 'ing', 'ug', 'sch', 'kel',
            'b', 'rm', 'an', 'gel', 'ang', 'ist', 'kt'],
    "n": ['en', 'aus', 'ment', 'rn', 'nis']
}

rules = {
    "f": ['e', 'g', 'acht', 'it', 'ei', 'ät', 'nz', 'on', 'sicht', 'ik', 'ft', 'ur', 'rin', 'tin'],
    "m": ['ich', 'nn', 'r', 'ast', 'ss', 'll', 'eg', 'nd', 'ag', 'f', 'tz', 'ing',
        'nk', 'ug', 'alt', 'sch', 'kel', 'fel', 'b', 'uch', 'rm', 'aum', 'an',
        'eis', 'gel', 'rat', 'ang', 'bel', 'mm', 'ist', 'ock', 'kt', 'ack',
        'ant', 'mus'],
    "n": ['es', 'en', 'aus', 'ld', 'o', 'immer', 'ück', 'ment', 'ett', 'rn', 'iel',
        'nis', 'ot', 'as', 'tier', 'ln', 'et', 'ium']
}


rules = {
"f": ['g', 'bahn', 'uer', 'ur', 'tat', 'au', 'art', 'nz', 'in', 'ra', 'i',
        'on', 'it', 'ht', 'ft', 'e', 'hr', 'ik', 'hrt', 'ät'],
"m": ['us', 'bau', 'at', 'alt', 'ag', 'l', 'ing', 'r', 'kt', 'f', 'eg', 'rg',
        'hs', 'b', 'ang', 'm', 'ck', 'mut', 'aden', 'ein', 'h', 'ig', 'ort',
        'eis', 'nt', 'nk', 'itt', 'an', 'nn', 'pen', 'ug', 'wagen', 'ss', 'nd',
        'st', 'ott', 'p', 'sten', 'z', 'hn'],
"n": ['ld', 'zeug', 'ende', 'et', 'lz', 'ad', 'o', 'al', 'eh', 'ot', 'sser',
        'hiff', 'um', 'eck', 'rk', 'as', 'echt', 'ent', 'ma', 'buch', 'nis',
        'wort', 'iel', 'ed', 'n', 'oss', 'ell', 'och', 'il', 'tt', 'os', 'aus',
        'ach', 'ind', 'land', 'isch', 'tier', 'es', 'id', 'immer', 'ttel',
        'ück']
}

"""
rules = {'f': ['e', 'g', 'it', 'ei', 'ät', 'nz', 'on', 'ik', 'ft', 'ur', 'rin'],
 'm': ['ch', 'nn', 'r', 'st', 'ss', 'll', 'nd', 'ag', 'f', 'tz', 'ing', 'ug',
       'el', 'b', 'rm', 'an', 'ang', 'kt'],
 'n': ['en', 'aus', 'ld', 'o', 'ent', 'rn', 'nis', 'il', 'um']}


rules = [(v, k) for k in rules for v in rules[k]]
rules.sort(key=lambda v: v[1])

def supported(word):
    for e, _ in rules:
        if word.endswith(e):
            return True
    return False


def make_filtered_nouns():
    data = json.load(open('de_frequent_nouns.json', 'r'))
    data = [d for d in data if supported(d['noun']) and d['gender'] in {'f', 'm', 'n'}]

    # sort the words into different endings
    edd = dict(rules)

    result = {end: [] for end in edd}

    for d in data:
        word = d['noun']
        ending = None

        for end_len in [1, 2, 3, 4, 5, 6]:
            end = word[-end_len:]
            if end in edd:
                ending = end  # longer word takes precedence

        if ending is not None:
            result[ending].append(d)

    json.dump(result, open('38.json', 'w'), indent=2, sort_keys=True)

make_filtered_nouns()

nouns = freq_nouns()
print('Total nouns:', len(nouns))

nouns = [(n, g) for n, g in nouns if supported(n)]
genders = [g for n, g in nouns]
words = [n for n, g in nouns]

print('Used nouns:', len(nouns))

# occurances of different genders - feminine seems most frequent
counts = [(k, genders.count(k)) for k in ['f', 'm', 'n']]
print('Conuts per gender:', counts)


def classify(word):
    match_len = 0
    result = 'f'

    for ending, gender in rules:
        if word.endswith(ending) and len(ending) > match_len:
            result = gender
            match_len = len(ending)

    return result


scores = [(1 if classify(n) == g else 0) for n, g in nouns]
accuracy = sum(scores) / len(nouns)

print('Trivial accuracy:', max(counts, key=lambda x: x[1])[1] / len(nouns))
print('Model accuracy:', accuracy)

acc_gen = [(g, sum(v for gg, v in zip(genders, scores) if gg == g) / len([1 for gt in genders if gt == g])) for g in ['f', 'm', 'n']]
print('Model accuracy per gender:', acc_gen)

endings = [e for e, g in rules]
endings.sort()

# aggregate over the word ending
acc_end = [
    (
        len([w for w in words if w.endswith(e)]),
        sum(y for y, w in zip(scores, words) if w.endswith(e)) / len([w for w in words if w.endswith(e)]),
        e
    )
    for e in endings
]

print('Accuracy per ending:')
for c, v, k in sorted(acc_end, key=lambda v: v[1]):
    print(k, c, round(v, 3))