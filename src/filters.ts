namespace Filters {
    let notProjectRegex = /\!\+\S+/
    let notResourceRegex = /\!@\S+/
    let priorityFilterRegex = /\([<>][A-Za-z]\)/
    export type FilterFn = (entry: Data.TodoEntry) => boolean;

    export class Filter {
        appendixEntry: Data.TodoEntry = new Data.TodoEntry("")
        apply: FilterFn
    }

    export function fromString(input: string): Filter {
        let filters: FilterFn[] = []

        let remains = input.trim()
        let match
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
        let parse = new Data.TodoEntry("")
        parse = Data.TodoEntry.fromString(input)
        if (parse != null) {
            if (parse.priority != "") filters.push((element) => element.priority == parse.priority)
            if (parse.title != "") filters.push((element) => element.title.startsWith(parse.title))
            for (let item of parse.projects) filters.push((element) => element.projects.includes(item))
            for (let item of parse.resources) filters.push((element) => element.resources.includes(item))

        }

        return (entry) => {
            for (let filter of filters) {
                if (!filter(entry)) return false;
            }
            return true;
        }
    }
}