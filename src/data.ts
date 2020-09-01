namespace Data {
    let projectRegex = /\+\S+/
    let resourceRegex = /@\S+/
    let propertyRegex = /\w+:\S+/
    let priorityRegex = /\([A-Za-z]\)/
    let createDateRegex = /^\d\d\d\d-\d\d-\d\d/

    export class TodoEntry {
        private static lastID = 0
        private id: number;

        static fromString(input: string): TodoEntry | null {
            if(input == undefined) return null
            let remains = input.trim()
            if (remains.length == 0) return null
            let result = new TodoEntry(input)
            let match
            if (input.startsWith("x ")) {
                result.done = true
                remains = remains.substr(2).trim()
            }
            match = remains.match(createDateRegex)
            if (match != null) {
                result.created = match[0]
                remains = remains.substr(match[0].length)
            }
            match = remains.match(priorityRegex)
            if (match != null) {
                result.priority = match[0][1]
                remains = Utils.removeFromString(remains, match.index, match[0].length)
            }
            while ((match = remains.match(projectRegex)) !== null) {
                let item = match[0].substr(1)
                result.projects.push(item)
                projects.add(item)
                remains = Utils.removeFromString(remains, match.index, match[0].length)
            }
            while ((match = remains.match(resourceRegex)) !== null) {
                let item = match[0].substr(1)
                result.resources.push(item)
                resources.add(item)
                remains = Utils.removeFromString(remains, match.index, match[0].length)
            }
            while ((match = remains.match(propertyRegex)) !== null) {
                let [name, value] = match[0].split(":")
                result.properties[name] = value
                properties.add(name)
                remains = Utils.removeFromString(remains, match.index, match[0].length)
            }
            result.title = shortenWhitespace(remains)
            return result
        };
        toString(): string {
            let result = ""
            if (this.done) result += "x "
            if (this.priority.length > 0) result += `(${this.priority}) `
            result += this.title
            for (let item of this.projects) result += " +" + item
            for (let item of this.resources) result += " @" + item
            for (let item in this.properties) result += " " + item + ":" + this.properties[item]
            return result
        };
        append(entry: TodoEntry) {
            if(!entry) return;
            if (this.priority == "") this.priority = entry.priority
            for (let item of entry.projects) if (!this.projects.includes(item)) this.projects.push(item)
            for (let item of entry.resources) if (!this.resources.includes(item)) this.resources.push(item)
        };
        static compare(a:TodoEntry, b:TodoEntry) : number {
            let c
            if(b.done!== a.done){
                return a.done?1:-1
            } 
            c = a.priority.localeCompare(b.priority)
            if(c!=0) {
                if(a.priority == "") return 1
                if(b.priority == "") return -1
                return c
            }
            c = a.title.localeCompare(b.title)
            if(c!=0) return c
        }
        constructor(
            public title: string,
            public priority: string = "",
            public projects: string[] = [],
            public resources: string[] = [],
            public properties: { [key: string]: any } = {},
            public done: boolean = false,
            public created: string = "",
            id: number | undefined = undefined) {
            this.id = id ?? TodoEntry.lastID++
        }
    }

    export function toString(): string {
        let result = ""
        for(let entry of entries){
            result += entry.toString() + "\n"
        }
        return result
    }
    export function fromString(input: string): void {
        if(input == undefined) return null
        let lines = input.split('\n')
        for (let line of lines) {
            let entry = TodoEntry.fromString(line)
            if (entry != null) entries.push(entry)
        }
        entries.sort(TodoEntry.compare)
    }
    export function clear() {
        projects.clear()
        resources.clear()
        properties.clear()
        entries = []
    }
    export function addEntry(entry: TodoEntry){
        entries.splice(sortedIndex(entries,entry,TodoEntry.compare),0,entry)
    }
    export function removeEntry(entry: TodoEntry) {
        entries.splice(sortedIndex(entries,entry,TodoEntry.compare),1)
    }
    export let projects = new Set<string>()
    export let resources = new Set<string>()
    export let properties = new Set<string>()
    export let entries: TodoEntry[] = []

    entries.push(new TodoEntry("Foo"))
    entries.push(new TodoEntry("Bar"))
    entries.push(new TodoEntry("Cheese"))
    entries.push(new TodoEntry("Bacon"))

    function shortenWhitespace(input: string) {
        let previous = input
        let output = input.trim().replace(/\s+/, " ")
        while (output !== previous) {
            previous = output
            output = output.replace(/\s+/, " ")
        }
        return output
    }

    function sortedIndex<T>(array: T[], value: T, comparator: {(a:T,b:T):number}) {
        var low = 0,
            high = array.length;
    
        while (low < high) {
            var mid = (low + high) >>> 1;
            if (comparator(array[mid],value) < 0) low = mid + 1;
            else high = mid;
        }
        return low;
    }
}


