function select_at_random(arr){
    var rand = arr[Math.floor(Math.random() * arr.length)];
    return rand
}

class MnemonicFinder{
    constructor(words_list){
        this.prefixes = {}  // format: prefix -> list of all words that match the prefix
        for(var word of words_list){
            var prefix = ""
            for(var c of word){
                prefix = prefix + c
                var word_diff = 1
                if(prefix in this.prefixes){
                    word_diff = this.prefixes[prefix][0].length - word.length
                }
                if(word_diff > 0){
                    this.prefixes[prefix] = [word]
                }
                if(word_diff === 0){
                    this.prefixes[prefix].push(word)
                }
            }
        }
        this.cache = {}
        this.max_depth = 5
    }

    error_prefix(prefix){
        if(prefix in this.prefixes){
            return [0, [prefix]]
        }

        for(var i=0; i<prefix.length; i++){
            var before = prefix.slice(0, i)
            var after = prefix.slice(i+1, prefix.length)

            var p = before + after

            if(p in this.prefixes){
                return [1, [p]]
            }
        }

        return null
    }

    score(solution){
        var total_error = solution[0]
        var total_length = solution[1].length
        return total_error
    }

    _find(word, depth){
        var key = [word, depth]
        if(key in this.cache){
            return select_at_random(this.cache[key])
        }

        if(word.length === 0 | depth >= this.max_depth){
            return [word.length, []]
        }

        var word = word.toLowerCase();
        var best_solution =[ [word.length, []] ]
        var best_score = this.score(best_solution[0])

        for(var i=word.length; i>0; i--){
            var p = word.slice(0, i)
            var remainder = word.slice(i, word.length)
            
            var match = this.error_prefix(p)

            if(match === null){
                continue
            }

            var sub = this._find(remainder, depth+1)
            var new_solution = [match[0] + sub[0], match[1].concat(sub[1])]
            var new_score = this.score(new_solution) 
            if(new_score < best_score){
                best_solution = [new_solution]
                best_score = new_score
            }
            if(new_score == best_score){
                best_solution.push(new_solution)
            }
        }
        
        this.cache[key] = best_solution
        return select_at_random(this.cache[key])
    }

    find(word, max_depth=6){
        this.max_depth = max_depth
        this.cache = {}
        
        var match = this._find(word, 0)
        console.log(match)

        var result = []
        for(var p of match[1]){
            result.push([p, select_at_random(this.prefixes[p])])
        }
        return {'mnemonic': result, 'error': match[0]}
    }

    find_up_to(word, max_depth=6){
        var result = []
        for(var depth=1; depth<=max_depth; depth++){
            result.push([depth, this.find(word, depth)])
        }
        return result
    }
}


Vue.component('word-mnemonic', {
    data: function(){
        return {
            loaded: false,
            prefixes: null,
            word: "",
            mnemonic: null
        }
    },
    methods: {
        findMnemonic: function(){
            this.mnemonic = this.finder.find_up_to(this.word, 7)
        }
    },
    mounted: function(){
        var self = this
        $.getJSON(
            './data/english5000.json',
            (json)=>{
                self.finder = new MnemonicFinder(json)
                self.loaded = true
            }
        )
    },
    template: 
`<div>
    <div>
        <label>Enter word for which you desire to get mnemonic in the field below.</label>
        <input v-model="word">
    </div>
    <div>
        <button v-bind:disabled="!loaded" v-on:click="findMnemonic()">Generate mnemonic</button>
    </div>
    <div>
        <ul id="example-1">
            <li v-for="item in mnemonic">
                length: {{ item[0] }}, error: {{ item[1].error }}, 
                <i v-for="mnemo in item[1].mnemonic">{{ mnemo[0] }}({{ mnemo[1] }}) </i>
            </li>
        </ul>
    </div>
</div>`
})