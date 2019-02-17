/*This creates GUI for knowledge test of particular set of words.*/

function rndArrSelect (arr){
    var rand = arr[Math.floor(Math.random() * arr.length)];
    return rand
}

function rndDctSelect(dct){
    var keys = []
    for(var v in dct){
        keys.push(v)
    }
    var key = rndArrSelect(keys)
    var value = dct[key]

    return [key, value]
}

function KnowledgeTest(divId, words){
  this.divId = divId;
  this.words = words;
  this.phrase_data = null;

  this.current_phrase = null;
  this.current_word = null;
  this.correct_answers = 0;
  this.total_answers = 0;

  this.getElem = function (id){
    var full_id = this.divId + id;
    var result = document.getElementById(full_id)
    return result
  }

  this.make_ids = function (gui){
    var result = gui;
    result = result.replace(new RegExp("id='", "g"), "id='"+this.divId);
    result = result.replace(new RegExp('id="', "g"), 'id="'+this.divId);
    return result;
  }

  

  this.render_phrase = function(phrase){
    // clear the div
    var div = this.getElem('selected_phrase')
    div.innerHTML = "";

    var result = [];
    var sep = {'.':1, ',':1, '!':1, '?':1, '-':1}
    for(var token of phrase[0]){
        if(token in sep){
            var elem = document.createElement('b')
            elem.innerHTML = token
            div.appendChild(elem)
            continue
        }
        var elem = document.createElement('a')
        var self = this;

        var handler = function(){
            var href = 'https://en.wiktionary.org/wiki/' + token + '#German';
            return function(){
                self.getElem('wordframe').src = href;
            }
        }();


        elem.innerHTML = " "+token
        elem.onclick = handler;

        div.appendChild(elem)
    }
  }

  this.make_phrase = function(){
    // generate secret word
    var word = rndArrSelect(this.words);
    var available_phrases = this.phrase_data[word];
    var phrase = rndArrSelect(available_phrases)

    this.current_phrase = phrase;
    this.current_word = word;

    // replace the target word
    var p = []
    for(var token of phrase[0]){
        if(token === word){
            p.push('_______')
        }else{
            p.push(token)
        }
    }

    this.render_phrase([p])

    this.getElem('check_button').enabled = true
  }

  this.check_answer = function(){
    var answer = this.getElem('selected_answer').value

    var correct = answer == this.current_word

    if(correct){
        this.correct_answers += 1;
        this.getElem('status').innerHTML = "Correct answer!"
    }else{
        this.getElem('status').innerHTML = "Sorry, wrong answer."
    }
    this.total_answers += 1;

    this.render_phrase(this.current_phrase)

    this.getElem('correct_answers').innerHTML = this.correct_answers;
    this.getElem('total_answers').innerHTML = this.total_answers;
    // check only once
    this.getElem('check_button').enabled = false;

  }

  this.show_counts = function(){
    var counts = {}

    for(var word of this.words){
        counts[word] = this.phrase_data[word].length
    }

    alert(JSON.stringify(counts))
  }

  this.initialize = function (){
    // create the GUI
    var gui = `
    <div class='row'>
        <div class='column column-50'>
            <p>Plugin status: <b id='plugin_status'>Loading data ...</b></p>
            <p>Choose among these words: <b id='word_selection'></b>;</p>
            <div id='selected_phrase'></div>
            <input type="text" id="selected_answer">
            <p id='status'></p>
            <button id='check_button'>Check answer</button>
            <button id='next_button'>Next</button>
            <p>Stats: correct answers=<b id='correct_answers'></b>, answers total=<b id='total_answers'></b></p>
            <a id='make_word_count'>Developer task statistics.</a>
        </div>
        <div class='column column-50'>
            <p>If you click on words, their description will appear here.</p>
            <iframe id="wordframe" width='100%' height='100%'>
            </iframe>
        </div>
    </div>
    `;

    // root div is accessible using ''
    this.getElem('').innerHTML = this.make_ids(gui)
    this.getElem('word_selection').innerHTML = this.words

    this.getElem('check_button').onclick = () => {
        this.check_answer();
    }
    this.getElem('next_button').onclick = () => {
        this.make_phrase();
    }
    this.getElem('make_word_count').onclick = () => {
        this.show_counts();
    }


    // assign callbacks
    var self = this;

    // load the data
    $.getJSON('./data/phrases_150k.json', (data)=>{
        this.getElem('plugin_status').innerHTML = 'Preprocessing data ...'
        // dict for all phrases which contain necessary words
        this.phrase_data = {};

        // dictionary of all words that will be tested
        var word_dict = {}

        // initialize dicts
        for(var word of this.words){
            word_dict[word] = 1;
            this.phrase_data[word] = []
        }

        // sort phrases
        for(var phrase of data){
            // phrase is a sequence of tokens. Check if any token corresponds to a word
            for(var token of phrase[0]){
                // if there is a necessary word token - push it into separated phrases
                if(token in word_dict){
                    this.phrase_data[token].push(phrase)
                }
            }
        }
        this.getElem('plugin_status').innerHTML = 'Ready'
    })


  }

  this.initialize();
}


function ArticleDDDTester(name_of_div){
    var preps = {
        "accusative": {
            "bis": "till", 
            "durch": "through", 
            "für": "for", 
            "gegen": "against, to", 
            "ohne": "without", 
            "um": "at a particular time"
        },
        "accusative or dative": {
            "an": "at, to, up next to", 
            "auf": "on, on top of", 
            "entlang": "along", 
            "hinter": "back", 
            "in": "in", 
            "neben": "at the side of", 
            "über": "over", 
            "unter": "under", 
            "vor": "before", 
            "zwischen": "between"
        },
        "dative": {
            "aus": "out", 
            "außer": "out of", 
            "bei": "located at, at the", 
            "gegenüber": "opposite", 
            "mit": "with", 
            "nach": "after,towards", 
            "seit": "since", 
            "von": "from", 
            "zu": "to, at"
        },
        "genetive": {
            "statt": "in place", 
            "trotz": "despite", 
            "während": "while, during, at the time of", 
            "wegen": "because of"
        }
    }



    var main_div = document.getElementById(name_of_div)

    var ui = `
    <div class='row'>
        <div class='column'>
            <p>For specified gender and action type, enter preposition and proper article. </p>
            <p id='task_description'></p>
            <input type="text" id='selected_answer'>
            <p id='status'></p>
            <button id='check_button'>Check answer</button>
            <button id='next_button'>Next</button>
            <p>Stats: correct answers=<b id='correct_answers'></b>, answers total=<b id='total_answers'></b></p>
        </div>
    </div>
    `

    ui = ui.replace(/id='/g, "id='random_str_")
    main_div.innerHTML = ui

    function get(id){
        return document.getElementById('random_str_' + id)
    }

    var current_state = {
        'answer': null,
        'total': 0,
        'wrong': 0
    }

    var case_gender_to_article = {
        'nominative': {'M': 'der', 'N': 'das', 'F': 'die', 'P': 'die'},
        'accusative': {'M': 'den', 'N': 'das', 'F': 'die', 'P': 'die'},
        'dative': {'M': 'dem', 'N': 'dem', 'F': 'der', 'P': 'den+n'},
        'genetive': {'M': 'des+[e]s', 'N': 'des+[e]s', 'F': 'der', 'P': 'der'},
    }

    get('next_button').onclick = function (ev){
        // select gender
        var gender = rndArrSelect(['M', 'N', 'F', 'P'])
        var action = rndArrSelect(['Active', 'Passive'])

        var [case_, prep_choice] = rndDctSelect(preps)
        var [prep, prep_trans] = rndDctSelect(prep_choice)

        var real_case_ = case_

        if(case_ === 'accusative or dative'){
            if(action === 'Active'){
                real_case_ = 'accusative'
            }else{
                 real_case_ = 'dative'
            }
        }

        // choose correct tense
        var article = case_gender_to_article[real_case_][gender]

        current_state['answer'] = prep + " " + article

        get('task_description').innerHTML = "Gender: " + gender + ", action: " + action + ", preposition: " + prep_trans
        get('selected_answer').value = ""
    }

    get('check_button').onclick = function(ev){
        var answer = get('selected_answer').value
        var correct_answer = current_state['answer']

        current_state['total'] += 1
        var status = get('status')
        status.innerHTML = correct_answer
        
        if(answer === correct_answer){
            status.innerHTML += ', CORRECT!!!!!'
        }else{
            current_state['wrong'] += 1
        }

        get('correct_answers').innerHTML = current_state['total'] - current_state['wrong']
        get('total_answers').innerHTML = current_state['total']
    }

}


function NounGenderGuessTest(name_of_div){

    var main_div = document.getElementById(name_of_div)
    var session_id = "id" + Math.random()

    var ui = `
    <div class='row'>
        <div class='column'>
            <p>For a given noun, specify its gender: das - neutral, der - masculine, or die - feminine.
            Specify the answer in the box below as a single letter. Click "Next" to load a word. </p>
            <p id='task_description'></p>
            <input type="text" id='selected_answer'>
            <p id='status'></p>
            <button id='f_button'>die</button>
            <button id='m_button'>der</button>
            <button id='n_button'>das</button>
            <button id='check_button'>Check answer</button>
            <button id='next_button'>Next</button>
            <p>Stats: correct answers=<b id='correct_answers'></b>, answers total=<b id='total_answers'></b></p>
        </div>
    </div>
    `

    ui = ui.replace(/id='/g, "id='"+session_id)
    main_div.innerHTML = ui

    function get(id){
        return document.getElementById(session_id + id)
    }

    // load the data
    $.getJSON('./data/de_filtered_nouns.json', (data)=>{

        var current_state = {
            'answer': null,
            'total': 0,
            'wrong': 0
        }

        var gmap = {
            'n': 'das',
            'f': 'die',
            'm': 'der'
        }

        get('next_button').onclick = function (ev){
            // select gender
            var selected = rndArrSelect(data)

            current_state['answer'] = gmap[selected['gender']]

            get('task_description').innerHTML = "Noun: " + selected['noun']
            get('selected_answer').value = ""
        }

        get('check_button').onclick = function(ev){
            var answer = get('selected_answer').value
            var correct_answer = current_state['answer']

            current_state['total'] += 1
            var status = get('status')
            status.innerHTML = correct_answer

            if(answer === correct_answer){
                status.innerHTML += ', CORRECT!!!!!'
            }else{
                current_state['wrong'] += 1
            }

            get('correct_answers').innerHTML = current_state['total'] - current_state['wrong']
            get('total_answers').innerHTML = current_state['total']

            if(answer === correct_answer){
                get('next_button').click()
            }
        }

        get('f_button').onclick = function (ev){
            get('selected_answer').value = 'die'
            get('check_button').click()
        }

        get('m_button').onclick = function (ev){
            get('selected_answer').value = 'der'
            get('check_button').click()
        }

        get('n_button').onclick = function (ev){
            get('selected_answer').value = 'das'
            get('check_button').click()
        }

    })

}