/**
 * Contains a definition of a set of useful functionality 
 * to test the user's grammar. 
 * Based on materials from https://www.deutsch-lernen.com.
 */

// root component for the exercises
Vue.component('grammar-exercises', {
    data: function(){
        return {
            pickedExercise: 'modal'
        };
    },
    template: 
`<div>
    <label>Choose the exercise type:</label>
    <button v-on:click="pickedExercise='modal'">Modal verbs</button>
    <button v-on:click="pickedExercise='derdie'">Der, Die, Das, ...</button>

    <label>Chosen exercise:</label>
    <div v-if="pickedExercise==='modal'">
        <modal-verbs></modal-verbs>
    </div>
    <div v-if="pickedExercise==='derdie'">
        Under construction!
    </div>
</div>`
})


Vue.component('modal-verbs', {
    data: function(){
        return {
            loaded: false,
            rules: [],
            word: "",
            selected_word: "",
            total_done: 0,
            correct_done: 0,
            exercise_ratio: "",
            infinite: "",
            time: "", 
            pronoun: "", 
            msg: ""
        };
    },
    mounted: function(){
        var self = this
        load_json(
            './data/modal_verbs.json',
            (json)=>{
                self.rules = json
                self.loaded = true
            }
        )
    },
    methods: {
        check_word: function(){
            this.total_done += 1;
            if(this.word === this.selected_word){
                this.correct_done += 1;
                this.msg = "Correct!";
            } else {
                this.msg = "Correct answer: " + this.selected_word;
            }
            this.exercise_ratio = this.correct_done / this.total_done
            this.next_exercise()
        },
        next_exercise: function(){
            var selected_rule = rndArrSelect(this.rules)
            
            this.time = selected_rule[0]
            this.pronoun = selected_rule[1]
            this.infinite = selected_rule[2]
            this.selected_word = selected_rule[3]

            this.word = '';
        },
    },
    template: 
`<div>
    Check out <a href="https://deutsch.lingolia.com/en/grammar/verbs/modal-verbs">source</a> on the modal verbs in German.
    Enter correct modal verb, and press "enter" to check the word.
    <div v-if="loaded===false">
        Loading ...
    </div>
    <div v-if="loaded===true">
        <br> <b> Setting: </b> {{time}} {{pronoun}} {{infinite}}
        <div class="column column-75">
            <input v-model="word" v-on:keyup.enter="check_word">
        </div>
        <button v-on:click="check_word()">Check</button>
        <button v-on:click="next_exercise()">Next</button>
        <br> <b>Total exercises done: </b> {{total_done}}
        <br> <b>Correctly done: </b> {{correct_done}}
        <br> <b>Ratio: </b> {{exercise_ratio}}
        <br> {{ msg }}
    </div>
</div>`
})

