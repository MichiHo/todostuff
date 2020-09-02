//import $ = require("jquery");

namespace UIElements {
    const zeroWidthSpace = '\u200B'

    /**
     * A field for displaying a chosen file and 
     */
    export class FileField {
        constructor(public callback?: { (path: string): void }, id?: string) {
            this.element = $("<div>").addClass("flex-field file-input")
            this.pathLabel = $("<span class='grow path'>--</span>").appendTo(this.element)
            $("<span class='grow placeholder'>No file selected</span>").appendTo(this.element)
            if (id) this.element.attr("id", id)
            this.element.append($("<button>").click(e => {
                let [filePath,] = dialog.showOpenDialogSync(this.dialogOptions);
                if (filePath === undefined) {
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
            if (filePath == null || filePath == "") {
                this.element.addClass("empty")
                return
            }
            this.element.removeClass("empty")
            let elements = filePath.split(/\\|\//g)
            let dirString = ""
            for (let i = 0; i < elements.length - 1; ++i) {
                dirString += elements[i] + "/" + zeroWidthSpace
            }
            this.pathLabel.append(`<span class="dirs">${dirString}</span>`)
            this.pathLabel.append(`<span class="file">${elements[elements.length - 1]}</span>`)
        }
        public getPath(): string {
            return path
        }

        private filePath: string = null
        public readonly element: JQuery
        private readonly pathLabel: JQuery
        public dialogOptions: Electron.OpenDialogSyncOptions = {
            filters: [{ name: "All files", extensions: ["*"] }],
            properties: [
                "promptToCreate",
                "createDirectory"
            ]
        }
    }

    /**
     * A text field which becomes editable on double click. In editing mode, changes are committed
     * by pressing Enter and reverted by pressing Escape. On commit, a callback is fired and the 
     * new value is reflected in the displaying mode. 
     */
    export class EditableTitle {
        /**
         * Root component, to be appended to the parent component.
         */
        public container: JQuery
        input: JQuery
        content: JQuery

        constructor(text: string, public placeholder: string = "", public onCommit: { (value: string): void } = () => { }) {
            this.container = $("<div>").attr("title", "Doubleclick to edit")
            this.content = $("<span>").appendTo(this.container).text(text)
            this.input = $("<input>").appendTo(this.container).css("display", "none").val(text).attr("placeholder", placeholder)
            this.content.dblclick(() => this.startEdit())
            this.input.keydown((e) => {
                if (e.which == 13) { // Enter
                    this.finishEdit(true)
                } else if (e.which == 27) { // Escape
                    this.finishEdit(false)
                } else return;
            })
        }

        public startEdit() {
            this.input.css("display", "").val(this.content.hasClass("placeholder") ? "" : this.content.text()).focus()
            this.content.css("display", "none")
        }
        /**
         * Finish the editing and revert to displaying state.
         * @param commit If true, the entered text is commited by calling the onCommit callback and
         * changing the display text
         */
        public finishEdit(commit: boolean) {
            if (commit) this.onCommit(this.input.val() as string)
            else this.input.val(this.content.hasClass("placeholder") ? "" : this.content.text())
            this.update()
            this.input.css("display", "none")
            this.content.css("display", "")

        }
        public update() {
            if ((this.input.val() as string).trim() == "") this.content.text(this.placeholder).addClass("placeholder")
            else {
                this.content.text(this.input.val() as string).removeClass("placeholder")
            }
        }

    }
}