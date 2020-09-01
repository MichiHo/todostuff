//import $ = require("jquery");

namespace UIElements {
    const zeroWidthSpace = '\u200B'
    
    export class FileField {
        constructor(public callback?: { (path: string): void }, id?:string) {
            this.element = $("<div>").addClass("flex-field file-input")
            this.pathLabel = $("<span class='grow path'>--</span>").appendTo(this.element)
            $("<span class='grow placeholder'>No file selected</span>").appendTo(this.element)
            if(id) this.element.attr("id",id)
            this.element.append($("<button>").click(e => {
                let [filePath,] = dialog.showOpenDialogSync(this.dialogOptions);
                if(filePath === undefined) {
                    console.log("No file selected")
                    return;
                }
                this.setPath(filePath)
                callback(filePath)
            }))
            this.setPath(null)
        }
        public setPath(filePath: string) {
            this.filePath = filePath
            this.pathLabel.empty()
            if(filePath == null || filePath == "") {
                this.element.addClass("empty")
                return
            }
            this.element.removeClass("empty")
            let elements = filePath.split(/\\|\//g)
            let dirString = ""
            for(let i = 0; i < elements.length-1; ++i) {
                dirString += elements[i] + "/" + zeroWidthSpace
            }
            this.pathLabel.append(`<span class="dirs">${dirString}</span>`)
            this.pathLabel.append(`<span class="file">${elements[elements.length-1]}</span>`)
        }
        public getPath(): string {
            return path
        }

        private filePath: string = null
        public readonly element: JQuery
        private readonly pathLabel: JQuery
        public dialogOptions : Electron.OpenDialogSyncOptions = {
            filters: [{ name: "All files", extensions: ["*"] }],
            properties: [
                "promptToCreate",
                "createDirectory"
            ]
        }
    }
}