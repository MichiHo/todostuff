namespace Filters {
    let notProjectRegex = /\!\+\S+/
    let notResourceRegex = /\!@\S+/
    let priorityFilterRegex = /\([<>][A-Za-z]\)/
    let metaPropertyRegex = /%[a-z]+/
    export type FilterFn = (entry: Data.TodoEntry) => boolean;

    export class Filter {
        /**
         * Entry whose properties are added to a new entry created within the context of the
         * filtered items
         */
        templateEntry: Data.TodoEntry = new Data.TodoEntry("")
        apply: FilterFn
        remainsOnly = false
    }

    export function fromString(input: string): Filter {
        let result = new Filter()
        let filters: FilterFn[] = []

        let templatePriority = ""
        let remains = input.trim()
        let match
        // meta properties
        while ((match = remains.match(metaPropertyRegex)) !== null) {
            let item = match[0].substr(1)
            switch (item) {
                case "remains": result.remainsOnly = true; break;
                case "done": filters.push((entry)=>entry.done)
            }
            remains = Utils.removeFromString(remains, match.index, match[0].length)
        }
        remains = remains.trim()
        // NOT done
        if (remains.startsWith("!x")) {
            filters.push((entry) => !entry.done)
            remains = remains.substr(2)
        }
        // NOT project
        while ((match = remains.match(notProjectRegex)) !== null) {
            let item = match[0].substr(2)
            filters.push((entry) => {
                return !entry.projects.includes(item)
            })
            remains = Utils.removeFromString(remains, match.index, match[0].length)
        }
        // NOT resource
        while ((match = remains.match(notResourceRegex)) !== null) {
            let item = match[0].substr(2)
            filters.push((entry) => {
                return !entry.resources.includes(item)
            })
            remains = Utils.removeFromString(remains, match.index, match[0].length)
        }
        // Priority range
        while ((match = remains.match(priorityFilterRegex)) !== null) {
            // We want "Z" < "A", which is not lexicographical
            let item = match[0]
            let smallerThan = item[1] == "<"
            let value = item[2].toUpperCase()
            if (!smallerThan && value == "A") {
                // Invalid filter. No priority larger than "A" exists
                continue;
            }
            if (templatePriority == "") {
                if (smallerThan && value == "Z") {
                    // Smaller than "Z" means no priority
                } else {
                    let code = value.charCodeAt(0)
                    templatePriority = String.fromCharCode(smallerThan ? code + 1 : code - 1)
                }
            }
            filters.push((entry) => {
                return smallerThan ?
                    (entry.priority == "" || entry.priority > value) :
                    entry.priority != "" && entry.priority < value
            })
            remains = Utils.removeFromString(remains, match.index, match[0].length)
        }

        let parse = Data.TodoEntry.fromString(remains)
        if (parse != null) {
            if (parse.priority != "") filters.push((element) => element.priority == parse.priority)
            else parse.priority = templatePriority
            if (parse.title != "") filters.push((element) => element.title.startsWith(parse.title))
            for (let item of parse.projects) filters.push((element) => element.projects.includes(item))
            for (let item of parse.resources) filters.push((element) => element.resources.includes(item))
            if (parse.done) filters.push((element) => element.done)
        }
        result.apply = (entry) => {
            for (let filter of filters) {
                if (!filter(entry)) return false;
            }
            return true;
        }
        result.templateEntry = parse
        return result;
    }
}