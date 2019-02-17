"""
This converts an OPUS dataset:
http://opus.nlpl.eu/OpenSubtitles2018.php
More specifically:
http://opus.nlpl.eu/download.php?f=OpenSubtitles2018/de-en.tmx.gz
Into a set of german sentences in a special format.
Download the dataset, unpack it, and specify the folder which
contains the dataset.
"""

# change the path below
data_folder = '/media/iaroslav/Data/datasets/german_subs_big'
file_name = 'de-en.tmx'

import os
import re
import json
import nltk # pip3 install nltk
from tqdm import tqdm

full_path = os.path.join(data_folder, file_name)

# read the file in memory
contents = open(full_path, 'r').read(33000000)

# how the german phrases are given
left = r'xml:lang="de"><seg>'
right = r'</seg></tuv>'

# compile the regular expression
pattern = re.compile(left + r'.{1,}' + right)

# this is used to check for possible foreign languages
allowedCharacters = "\t1234567890-= \"qwertzuiopü+asdfghjklöä#yxcvbnm,.-!§$%&/()=?QWERTZUIOPÜ*ASDFGHJKLÖÄ'YXCVBNM;:_#"
separatorChars = "\t-= \"+#,.-!§$%&/()=?*;:_#"

# efficient data structures
allowedCharacters = set(allowedCharacters)
separatorChars = set(separatorChars)

phrases = []

for v in tqdm(re.finditer(pattern, contents)):
    phrase = v.group(0)

    # remove the left and right padding of string
    phrase = phrase[len(left):]
    phrase = phrase[:-len(right)]

    # skip sentences with unknown characters
    disallowed_chars = set(phrase) - allowedCharacters
    if len(disallowed_chars) > 0:
        continue

    # split sentence into tokens
    tokens = nltk.word_tokenize(phrase, language='german')

    # skip too short phrases
    if len(tokens) < 4:
        continue

    while tokens[0] in separatorChars:
        tokens = tokens[1:]

    # a set representation for json
    words = {w:1 for w in tokens}

    phrases.append([tokens])

print('Total phrases obtained:', len(phrases))
json.dump(phrases, open('result.json', 'w'), separators=(',', ':'))