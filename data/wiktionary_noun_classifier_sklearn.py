"""
A script that attempts to generate a compact estimator model for the
gender of the noun, given the features of the noun, such as the ending.
As a baseline, the rule from https://www.fluentin3months.com/german-noun-genders/
can be taken, which gives a baseline of 58% accuracy to beat.
"""

import json
import numpy as np

from sklearn.preprocessing import StandardScaler
from sklearn.svm import LinearSVC
from sklearn.linear_model import SGDClassifier
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.pipeline import make_pipeline
from sklearn.dummy import DummyClassifier

import pandas as pd

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


class SklearnScorer():
    def __init__(self, X, y, words, postfix, rules_apply=0.9, max_endings=100):
        self.X = X
        self.y = y
        self.postfix = postfix
        self.words = words
        self.rules_apply = rules_apply
        self.max_endings = max_endings

        self.best_obj = 0.0
        self.best_params = None

    def log(self, *args, **kwargs):
        print(*args, **kwargs)

    def __call__(self, params):
        X = self.X
        y = self.y
        postfix = self.postfix

        print(params)
        threshold = params['threshold']

        mparams = {k:v for k,v in params.items() if k not in {'threshold'}}

        model = make_pipeline(
            SGDClassifier(penalty='elasticnet', max_iter=128, **mparams)
        )

        dummy = DummyClassifier()

        model.fit(X, y)
        dummy.fit(X, y)

        model_score = model.score(X, y)  # we have all the words - can test on train
        dummy_score = dummy.score(X, y)

        self.log('Dummy score:', dummy_score)
        self.log('Model score:', model_score)

        # make table with postfixes, sorted
        lin_model = model.steps[-1][-1]
        w = lin_model.coef_.T
        w = np.round(w, 3)

        # select most informative elements
        weight = np.abs(w).sum(axis=-1)
        w = np.column_stack([w, postfix])

        # drop non - informative postfixes
        S = weight > threshold
        w = w[S]
        weight = weight[S]

        # sort by importance
        I = np.argsort(weight)
        w = w[I]

        n_endings = len(I)
        self.log('Non - zero weights:', n_endings)

        # get accuracy on non - zero endings
        selected_postfx = w[:, -1].tolist()

        I = [any([word.endswith(post) for post in selected_postfx]) for word in self.words]
        I = np.array(I)

        Xs = X[I]
        ys = y[I]

        if len(ys) < 1:
            rule_accuracy = 0
            rule_applies = 0
        else:
            rule_accuracy = model.score(Xs, ys)
            rule_applies = len(Xs) / len(y)

        self.log('Applicable nouns:', int(rule_applies*100), '%')
        self.log('Applicable subset score:', rule_accuracy)

        final_objective = 0.0
        violated = False

        if rule_applies < self.rules_apply:
            final_objective -= abs(rule_applies - self.rules_apply)
            violated = True

        if n_endings > self.max_endings:
            final_objective -= abs(n_endings - self.max_endings) / 100
            violated = True

        if not violated:
            final_objective = rule_accuracy

        if final_objective > self.best_obj:
            self.best_obj = final_objective
            self.best_params = params
            self.result = {
                'rules': list(selected_postfx),
                'rules_score': rule_accuracy,
                'total_score': model_score,
                'best_params': params
            }

        return -final_objective


from skopt import Optimizer
from skopt.utils import point_asdict, point_aslist


nouns = freq_nouns()

# remove nouns with unknown gender
nouns = [nv for nv in nouns if nv[1] in {'n', 'f', 'm'}]

words = [w.lower() for w, g in nouns]
y = [g for w, g in nouns]

# generate postfixes
postfx = set()
for postfix_len in [1, 2, 3]:
    postfx |= set([w[-postfix_len:] for w in words])

postfx = sorted(list(postfx))

# exclude numbers and unknown characters
postfx = [p for p in postfx if not (set(p) & set('1234567890œ-'))]

# make features
X = [[w.endswith(p) for p in postfx] for w in words]
X = np.array(X)*1.0
y = np.array(y)

print(X.shape, y.shape)

def job(loss):
    scorer = SklearnScorer(
        X, y, words, postfx,
        rules_apply=0.8,
        max_endings=75
    )

    space = {
        'alpha': (0.0001, 1.0, 'log-uniform'),
        'l1_ratio': (0.001, 0.999),
        'loss': [loss],
        'epsilon': (0.001, 10.0, 'log-uniform'),
        'threshold': (0.00001, 0.001, 'log-uniform'),
    }

    opt = Optimizer(point_aslist(space, space))

    for i in range(128):
        p = opt.ask()
        p = point_asdict(space, p)

        f = scorer(p)

        opt.tell(point_aslist(space, p), f)
        print(f)
        print(i, scorer.best_obj, scorer.best_params)

    import json
    json.dump(scorer.result, open(loss + '.json', 'w'), indent=2, sort_keys=True)

from joblib import Parallel, delayed

losses = ['hinge', 'log', 'modified_huber', 'perceptron', 'squared_hinge']

Parallel(n_jobs=-1)(delayed(job)(loss) for loss in losses)