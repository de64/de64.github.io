"""
A script that attempts to generate a compact estimator model for the
gender of the noun, given the features of the noun, such as the ending.
As a baseline, the rule from https://www.fluentin3months.com/german-noun-genders/
can be taken, which gives a baseline of 58% accuracy to beat.
"""

import json
import numpy as np


def filter_data(nouns):
    return [n for n in nouns if n[1] in {'f', 'm', 'n'}]

def all_nouns():
    data = json.load(open('de_nouns.json', 'r'))
    data = [(k, v['gender']) for k, v in data.items()]
    data = filter_data(data)
    return data


def freq_nouns(top=10000):
    # loads shortened list of 7k nouns which occur often
    data = json.load(open('de_frequent_nouns.json', 'r'))
    data = data[:top]
    data = [(v['noun'], v['gender']) for v in data]
    data = filter_data(data)
    return data


anouns = all_nouns()
nouns = freq_nouns()

print('Total nouns:', len(nouns))

endings = {}

idx = {'n': 0, 'm': 1, 'f': 2}
ridx = {v:k for k, v in idx.items()}

# make counts for all postfixes
for w, g in nouns:
    if g not in {'m', 'f', 'n'}:
        continue

    w = w.lower()
    for postfix_len in [1, 2, 3, 4, 5, 6]:
        postfix = w[-postfix_len:]
        if postfix not in endings:
            endings[postfix] = np.zeros(3)
        endings[postfix][idx[g]] += 1

results = []

# get the impurities for postfixes and estim. gender
for k, v in endings.items():
    count = np.sum(v)
    score = np.max(v) / count
    gender = ridx[np.argmax(v)]

    results.append((score, count, gender, k))

# select all candidate rules
results = [r for r in results if (r[0] >= 0.8 and r[1] >= 50)]  # 0.64, 18

results.sort(reverse=True, key=lambda v: v[1])

# extract rules
rules = []

# sort the endings
for r in results:
    score, count, gender, ending = r
    rules.append((ending, gender))

# sparsify rules
rules_pure = []
for e, g in rules:
    if any([1 for e2, g2 in rules if (len(e2)<len(e) and e.endswith(e2) and g2 == g)]):
        continue

    rules_pure.append((e, g))

rules = rules_pure


def guess_gender(rules, word):
    result = 'f'
    max_len = 0
    for e, g in rules:
        # longer ending takes precedence
        if word.endswith(e) and len(e) > max_len:
            max_len = len(e)
            result = g

    return result


def rules_apply(rules, word):
    for ending, gest in rules:
        if word.endswith(ending):
            return True

    return False


def rules_coverage(rules, nouns):
    counter = 0
    for word, gender in nouns:
        if rules_apply(rules, word):
            counter += 1

    return counter / len(nouns)


import numpy as np
from pprint import pprint


def test_rules(rules, nouns):
    y = np.array([gender for word, gender in nouns])
    y_pred = np.array([guess_gender(rules, word) for word, gender in nouns])
    result = {}
    result['Accuracy'] = np.mean(y == y_pred)

    # accuracy per class
    accuracy_per_class = []
    for c in set(y):
        I = y == c
        c_acc = np.mean(y[I] == y_pred[I]).round(3)
        accuracy_per_class.append([c, len(y[I]), c_acc])

    accuracy_per_class.sort(reverse=True, key=lambda v:v[-1])
    result['Class accuracy'] = accuracy_per_class

    # accuracy per rule
    accuracy_per_rule = []
    for r, g in rules:
        I = [word.endswith(r) for word, gender in nouns]
        r_acc = np.mean(y[I] == y_pred[I]).round(3)
        accuracy_per_rule.append([r, g, len(y[I]), r_acc])

    accuracy_per_rule.sort(reverse=True, key=lambda v:v[-1])
    result['Rule accuracy'] = accuracy_per_rule

    return result

# print the rules
for gender in ['f', 'm', 'n']:
    print('Gender=', gender)
    print([e for e, g in rules if g == gender])

# print rule statistics
print('Number of rules:', len(rules))

for dset, name in [(nouns, 'Frequent nouns'), (anouns, 'All wiktionary nouns')]:
    print('============')
    print(name, 'group:')
    print('Rules coverage:', rules_coverage(rules, dset))
    print('Training nouns:')
    nouns_fixed = [n for n in dset if rules_apply(rules, n[0])]
    pprint(test_rules(rules, nouns_fixed), width=200, compact=True)
