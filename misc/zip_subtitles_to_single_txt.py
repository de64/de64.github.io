"""
I was looking for a corpus of conversational (kinda) German,
but somehow I could not find anything fast, so I just went to
https://www.opensubtitles.org/de/search/sublanguageid-ger
and clicked on ~100 pseudo - random files. This script can
be used to run on directory with downloaded zip files to convert
it to a single file with all the dialoges in it.
This is useful for testing the knowledge of words like `den` / `dem`,
where real sentences are used for that.
"""

download_fold = "/media/iaroslav/Data/datasets/german_subs"

import os
import zipfile
from tqdm import tqdm

all_texts = []

for f in tqdm(os.listdir(download_fold)):
    file = os.path.join(download_fold, f)

    with zipfile.ZipFile(file, 'r') as z:
        # find the name of srt file
        files = [v for v  in z.filelist if v.filename.endswith('.srt')]

        if len(files) < 1:
            continue

        # split the file contents by line breaks
        data = z.read(files[0])

        # convert data to unicode
        data = str(data, 'utf-8', errors='ignore')

        # delete the unnecessary symbols
        data = data.replace('\r', '')
        data = data.replace('<i>', '')
        data = data.replace('</i>', '')

        # split the data by lines
        data = data.split('\n')

        # this way it is easier to erase times
        data.reverse()
        skip = 0
        lines = []

        # clear all the lines with no actual content
        for line in data:
            if line == '':
                continue

            if "-->" in line:
                skip = 2
                continue

            skip -= 1

            if skip <= 0:
                lines.append(line)

        lines.reverse()
        lines = ' '.join(lines)
        all_texts.append(lines)



# join everything into one huge blob
all_texts = ' '.join(all_texts)

# separate sentences
all_texts = all_texts.split('.')

# drop empty lines
all_texts = [v for v in all_texts if v != '']

# save sentences as csv file
import json
json.dump(all_texts, open('tv_phrases.json', 'w'))
