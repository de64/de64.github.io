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

// proper audio support
window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || null;

// A block which can fold or un-fold a section with theory.
Vue.component('theory-block', {
    data: function () {
        return {
            theory: false
        }
    },
    methods: {
        toggleTheory: function(){this.theory = !this.theory},
    },
    template: 
`<div>
    <button v-on:click="toggleTheory">Toggle theory</button>
    <div v-if="theory">
        <slot></slot>
        <button v-on:click="toggleTheory">Toggle theory</button>
    </div>
</div>`
})

// show the definition of a German word from en.wiktionary.org in an iframe
Vue.component('def-de-wiktionary', {
    props: ['word', 'height'],
    template: 
`<div>
    <iframe width='100%' v-bind:height="height" v-bind:src="'https://en.wiktionary.org/wiki/' + word + '#German'"></iframe>
</div>`
})

// clickable word link
Vue.component('clickable-word', {
    props: ['word'],
    methods: {
        actionWord: function(){},
    },
    template: 
`<div>
    <a v-on:click="$emit('show-clicked-word', word)">{{word}}</a>
</div>`
})

// for some exercise can show overall performance of a user
Vue.component('exercise-overall-performance', {
    props: ['answer_summary'],
    data: function(){
        return {
            total_answers: 0,
            correct_answers: 0,
            answer_status: ""
        }
    },
    methods: {
        answer: function(correct){
            this.correct_answers += correct ? 1 : 0
            this.answer_status = correct ? "CORRECT!!!!!1" : ""
            this.total_answers += 1
        }
    },
    template: 
`<div>
    <label>Your performance:</label>
    <div>Result:<b> {{answer_summary}} {{answer_status}}</b></div>
    <div>Total answers:<b> {{total_answers}}</b></div>
    <div>Correct answers:<b> {{correct_answers}}</b></div>
    <div>Accuracy:<b> {{correct_answers/total_answers}}</b></div>
</div>`
})

function load_json(url, on_done){
    $.getJSON(url, on_done);
}

var punctuation = new Set([',', '.', '!', '?', '-', ':', ';'])

// exercise where you need to choose the right word from a number of choices
Vue.component('exercise-choose-right-word', {
    props: ['word_choices'],
    data: function(){
        return {
            loaded: false,
            sentences: null,
            answer: '',
            answer_summary: '',
            answer_truth: '',
            display_word: 'Hallo',
            task: []
        }
    },
    methods: {
        nextTask: function(){
            this.answer_truth = rndArrSelect(this.word_choices).toLowerCase()
            var sentence = rndArrSelect(this.sentences[this.answer_truth])[0]

            // will be converted to the clickable links so that the definition of the word can be shown
            var task_tokens = []

            // add spaces between words
            for(var word of sentence){
                // hide the correct answer
                if(word.toLowerCase() === this.answer_truth){
                    word = "___"
                }
                if(!punctuation.has(word)){
                    task_tokens.push(' ')
                }
                task_tokens.push(word)
            }

            this.task = task_tokens
        },
        checkAnswer: function (answer){
            this.answer = answer || this.answer
            this.answer_summary = 'Your answer: ' + this.answer + ", actual: " + this.answer_truth 
            this.$refs.performance.answer(this.answer === this.answer_truth)
            this.nextTask()
        }
    },
    mounted: function(){
        var self = this
        load_json(
            './data/phrases_150k.json',
            (json)=>{

                // make dict word: [all sentences with this word]
                var wdict = {}
                for(var sentence of json){
                    var words = sentence[0]
                    for(var word of words){
                        word = word.toLowerCase()

                        if(word in wdict){
                            wdict[word].push(sentence)
                        }else{
                            wdict[word] = [sentence]
                        }
                    }
                }

                self.sentences = wdict
                self.loaded = true
            }
        )
    },
    template: 
`<div>
    <div class="row">
        <div class="column">
            <p>
                <a v-for="word in task" v-on:click="display_word=word">{{word}}</a>
            </p>
            <div>
                <label>Enter your answer in the field below.</label>
                <input v-model="answer">
            </div>
            <div>
                <button style="margin-left: 4px" v-for="word in word_choices" v-on:click="checkAnswer(word)">{{word}}</button>
                <button v-on:click="checkAnswer()">Check</button>
                <button v-bind:disabled="!loaded" v-on:click="nextTask()">Next</button>
            </div>
            <exercise-overall-performance ref="performance" v-bind:answer_summary='answer_summary'></exercise-overall-performance>
        </div>
        <div class="column">
            <def-de-wiktionary v-bind:word='display_word' height='300px'></def-de-wiktionary>
        </div>
    </div>
    
</div>`
})

Vue.component('exercise-topic', {
    data: function(){
        return {
            loaded: false,
            topics: null,
            topic: '',
        }
    },
    methods: {
        nextTask: function(){
            var topic = rndArrSelect(this.topics)
            this.topic = topic
        }
    },
    mounted: function(){
        var self = this
        load_json(
            './data/essay_topics.json',
            (json)=>{
                self.topics = json
                self.loaded = true
            }
        )
    },
    template: 
`<div>
    <div class="row">
        <div class="column">
            <div>
                <button v-bind:disabled="!loaded" v-on:click="nextTask()">Show topic</button>
            </div>
            <p>
                {{topic}}
            </p>
        </div>
    </div>
</div>`
})



Vue.component('youtube-video-dw', {
    props: {
        width : {default: 640}, 
        height : {default: 480}
    },
    data: function(){
        return {
            loaded: false,
            videos: null,
            video: '',
        }
    },
    methods: {
        nextTask: function(){
            var video = rndArrSelect(this.videos)
            this.video = video
        }
    },
    mounted: function(){
        var self = this
        load_json(
            './data/youtube_videos_with_captions.json',
            (json)=>{
                self.videos = json
                self.loaded = true
            }
        )
    },
    template: 
`<div>
    <div class="row">
        <div class="column">
            <div>
                <button v-bind:disabled="!loaded" v-on:click="nextTask()">Show video</button>
            </div>
            <div style="text-align: center">
                <iframe v-if="video!==''" v-bind:width="width" v-bind:height="height" v-bind:src="'https://www.youtube.com/embed/' + video.id"></iframe>
            </div>
        </div>
    </div>
</div>`
})

Vue.component('spiegel-news', {
    props: {
        width : {default: 640}, 
        height : {default: 480}
    },
    data: function(){
        return {
            loaded: false,
            articles: null,
            article: '',
        }
    },
    methods: {
        nextTask: function(){
            var article = rndArrSelect(this.articles)
            this.article = article
        }
    },
    mounted: function(){
        var self = this
        load_json(
            './data/spiegel_news.json',
            (json)=>{
                self.articles = json
                self.loaded = true
            }
        )
    },
    template: 
`<div>
    <div class="row">
        <div class="column">
            <div>
                <button v-bind:disabled="!loaded" v-on:click="nextTask()">Show article</button>
            </div>
            <div style="text-align: center" v-if="article!==''">
                <label>Click below to open an article</label>
                <a v-bind:href="article.url"  target="_blank">{{article.title}}</a>
            </div>
        </div>
    </div>
</div>`
})


// multi - modal input by the user
Vue.component('user-mm-input', {
    props: {
        modality : {default: 'text'},
    },
    data: function(){
        return {
            total_text: '',
            interim_text: '',
            recognizer: null,
            running: false
        }
    },
    methods: {

        before_recording: function(){
            this.running = true
            if(this.recognizer === null){
                this.recognizer = new window.SpeechRecognition();
                this.recognizer.lang = "de-DE"
                this.recognizer.interimResults = true

                var vue = this;

                this.recognizer.onresult = function (event) {                    
                    for (var i = event.resultIndex; i < event.results.length; i++) {
                        var transcript = event.results[i][0].transcript
                        if (event.results[i].isFinal) {
                            vue.total_text += transcript
                        }else{
                            vue.interim_text = transcript
                        }
                    }
                };
                this.recognizer.onend = function (event) {
                    if(vue.running){
                        vue.recognizer.start()
                    }
                }
            }

            this.recognizer.start();
            

            console.log("Start")
        },
        pause_recording: function(){
            if(this.recognizer !== null){
                this.recognizer.stop();
            }
            this.running = false
            console.log("Pause")
        },
        after_recording: function(data){
            if(this.recognizer !== null){
                this.recognizer.stop();
            }
            this.running = false
            console.log("Done")
            this.nicify_text()
        },
        nicify_text: function(){
            var text = this.total_text

            var punctuation = ['.', ',', '!', '?']
            
            // fix punctuation
            for(var c of punctuation){
                for(var rep of [1, 2, 3, 4, 5]){
                    text = text.split(c+" ").join(c)
                }
                text = text.split(c).join(c + ' ')
            }
            
            var enders = ['.', '!', '?']
            // capitalize first letters
            for(var end of enders){
                var sentences = text.split(end + ' ')
                sentences = sentences.map((v)=>{
                    return v.charAt(0).toUpperCase() + v.slice(1);
                })
                text = sentences.join(end + ' ')
            }

            this.total_text = text
        }
    },
    template: 
`<div>
    <div class='row'>
        <div v-if="modality=='audio'" class='column column-40'>
            <audio-recorder
                :attempts="10"
                :time="6"
                :before-recording="before_recording"
                :pause-recording="pause_recording"
                :after-recording="after_recording"
            />
        </div>
        <div class='column'>
            <textarea v-if="modality=='audio'" style='height: 50px;' v-model='interim_text'
                placeholder="Press record and speak, current recognized text will appear here.">
            </textarea>
            <textarea style='height: 330px;' v-model='total_text'>
            </textarea>
        </div>
    </div>
</div>`
})


Vue.component('user-mm-task', {
    props: {
        modality : {default: 'article'}, 
    },
    template: 
`<div>
<spiegel-news      v-if="modality==='article'"></spiegel-news>
<youtube-video-dw  v-if="modality==='vid    eo'"></youtube-video-dw>
<exercise-topic    v-if="modality==='topic'"></exercise-topic>
</div>`
})


// https://medium.com/@bobthomas295/vuejs-and-plotly-js-reactive-charts-da9b3b59f2dc
Vue.component("plotly-chart", {
    props: ["chart"],
    template: '<div :ref="chart.uuid"></div>',
    mounted() {
      Plotly.plot(this.$refs[this.chart.uuid], this.chart.traces, this.chart.layout);
    },
    watch: {
      chart: {
        handler: function() {
          Plotly.react(
            this.$refs[this.chart.uuid],
            this.chart.traces,
            this.chart.layout
          );
        },
        deep: true
      }
    }
});


Vue.component("word-rehearsal", {
    data: function(){
        return {
            word: '',
            selected_word: 0,
            display_word: '',
            words: [],
            repeat_words: -1,
            all_words_text: ''
        }
    },
    mounted() {
        if (localStorage.words) {
            this.words = JSON.parse(localStorage.words)
        }
    },
    watch: {
        words:{
            handler() {
                this.update_stats()
                localStorage.setItem('words', JSON.stringify(this.words));
            },
            deep: true,
        }
    },
    methods: {
        words_to_recal: function(){
            var now = new Date().getTime()
            var result = []
            for(var word of this.words){
                var due = word.last + word.interval
                if(due <= now){
                    result.push(word)
                }
            }
            return result
        },
        update_stats: function(){
            this.repeat_words = this.words_to_recal().length
        },
        next_word: function(){
            // calculate all the words that need recalling
            var left_words = this.words_to_recal()
            if(left_words.length > 0){
                this.selected_word = rndArrSelect(left_words)
                this.word = this.selected_word.word
            }else{
                this.word = 'Nothing to recall, you are done :)'
            }
        },
        set_recall: function(remebered){
            if(remebered){
                var interval = this.selected_word.interval
                if(interval == 0.0){
                    // min. interval: 12 hours
                    interval = 6*60*60*1000
                }
                interval *= 2.0
                this.selected_word.interval = interval
                this.selected_word.last = new Date().getTime()
            }
            this.next_word()
        },
        add_word: function(){
            tiem = new Date().getTime()
            var wow = {
                'word': this.word,
                'interval': 0.0,
                'last': tiem,
                'added': tiem
            }
            console.log(wow)
            this.words.push(wow)
        },
        dump_words: function(){
            this.all_words_text = JSON.stringify(this.words)
        },
        parse_back: function(){
            this.words = JSON.parse(this.all_words_text)
        }
    },
    template: `
<div>
<div class="row">
    <div class="column">
        <div>
            <label>Active word:</label>
            <div class="row">
                <div class="column column-75">
                    <input v-model="word">
                </div>
                <div class="column column-25">
                    <button v-on:click="display_word=word">Wiki >>></button>
                </div>
            </div>
        </div>
        <div>
        <button v-on:click="set_recall(true)">Recalled</button>
        <button v-on:click="set_recall(false)">Forgot</button>
        <button v-on:click="next_word()">Next</button>
        <button v-on:click="add_word()">Add</button>
        </div>
        <div>
        <label>Words to repeat: {{repeat_words}}</label>
        <label>Words stored: {{words.length}}</label>
        </div>
    </div>
    <div class="column">
        <def-de-wiktionary v-bind:word='display_word' height='300px'></def-de-wiktionary>
    </div>
</div>
<div class="row">

</div>
    <button v-on:click="dump_words()">Show all words</button>
    <button v-on:click="parse_back()">Save changes</button>
    <textarea v-model='all_words_text'
        placeholder="Here you will see all the words that you have. You can make changes, and save them with button above.">
    </textarea>
</div>
`
})