import $ = require("jquery");

namespace UI {
    function createListEntry(entry: Data.TodoEntry): JQuery {
        let result = $("<div>").addClass("todo-entry done-" + entry.done).data("entry", entry).attr("tabindex", "0")
        /** Toggle done-status */
        let checkEvent = () => {
            Data.removeEntry(entry)
            entry.done = !entry.done
            Data.addEntry(entry)
            result.addClass("done-" + entry.done)
            result.removeClass("done-" + !entry.done)
            saveStateIndicator("unsaved")
            update()
            saveData()
        }
        /** Decide selection state */
        let selectEvent = (multiple: boolean) => {
            let wasSelected = result.hasClass("selected")
            if (multiple) result.parent().children(".todo-entry").removeClass("selected")
            if (result.hasClass("selected") == wasSelected) result.toggleClass("selected")
        }
        result.mousedown((e) => selectEvent(!e.shiftKey && !e.ctrlKey)).keydown(e => {
            if (e.which == 13) {
                checkEvent()
            } else if (e.which == 32) {
                selectEvent(!e.shiftKey && !e.ctrlKey)
            } else return
            e.stopPropagation()
            e.preventDefault()
        })
        $("<span>").addClass("prio").text(entry.priority).appendTo(result)
        $("<span>").addClass("title").text(entry.title).appendTo(result)
        for (let item of entry.projects) $("<span>").addClass("project").text(item).appendTo(result)
        for (let item of entry.resources) $("<span>").addClass("resource").text(item).appendTo(result)
        for (let item in entry.properties)
            $("<span>").addClass("property").appendTo(result)
                .append($("<span>").text(item).addClass("name"))
                .append($("<span>").text(entry.properties[item]).addClass("value"))
        $("<span>").text("x").addClass("check-button").click(e => {
            checkEvent()
            e.stopPropagation()
        }).appendTo(result)

        return result
    }
    function createList(): JQuery {
        let result = $("<div>").addClass("list")
        result.keydown((e) => {
            if (e.key == "Delete") {
                result.children("div.todo-entry.selected").each((i, htmlEl) => {
                    let entry = $(htmlEl).data("entry") as Data.TodoEntry
                    console.log("Removing " + entry.title)
                    Data.removeEntry(entry)
                })
            } else if (e.key == "x") {
                result.children("div.todo-entry.selected").each((i, htmlEl) => {
                    ($(htmlEl).data("entry") as Data.TodoEntry).done = true
                })
            } else if (e.key == "y") {
                result.children("div.todo-entry.selected").each((i, htmlEl) => {
                    ($(htmlEl).data("entry") as Data.TodoEntry).done = false
                })
            } else return;
            saveStateIndicator("unsaved")
            update()
            saveData()
        })
        return result
    }
    function editableHeader(text: string, placeholder: string, onCommit: { (value: string): void }): JQuery {
        let container = $("<div>").addClass("editable-header").attr("title", "Doubleclick to edit")
        let header = $("<h1>").appendTo(container).text(text)
        let input = $("<input>").appendTo(container).css("display", "none").val(text).attr("placeholder", placeholder)
        let updateHeader = () => {
            if ((input.val() as string).trim() == "") header.text(placeholder).addClass("placeholder")
            else {
                header.text(input.val() as string).removeClass("placeholder")
            }
        }
        updateHeader()
        header.dblclick(() => {
            input.css("display", "").val(header.hasClass("placeholder") ? "" : header.text()).focus()
            header.css("display", "none")
        })
        input.keydown((e) => {
            if (e.which == 13) {
            } else if (e.which == 27) {
                input.val(header.hasClass("placeholder") ? "" : header.text())
            } else return;
            onCommit(input.val() as string)
            updateHeader()
            input.css("display", "none")
            header.css("display", "")
        })
        return container
    }

    function showHideButton(target: JQuery, shown: boolean = true, callback?: { (shown: boolean): void }): JQuery {
        let btn = $("<button>").addClass("show-hide-button")
        target.toggleClass("collapsed", !shown)
        btn.click(() => {
            target.toggleClass("collapsed")
            // if (target.hasClass("collapsed")) btn.text(">")
            // else btn.text("<")
            if (callback) callback(!target.hasClass("collapsed"))
        })
        return btn
    }

    let updateCalls: { (): void }[] = []
    // {
    //     let list = createList().addClass("panel").attr("id", "main-list").appendTo("#main")
    //     $("<div>").addClass("panel-header").append(showHideButton(list)).append("<h1>All Tasks</h1>").appendTo(list)
    //     let createNewField = $("<div>").addClass("new-entry-field").appendTo(list)
    //     let createNewInput = $("<input>")
    //     createNewInput.keydown((e) => {
    //         if (e.which == 13) {
    //             let newEntry = Data.TodoEntry.fromString(createNewInput.val() as string)
    //             if (newEntry != null) {
    //                 Data.addEntry(newEntry)
    //                 update()
    //                 createNewInput.val("").focus()
    //             }
    //         }
    //     })
    //     createNewField.append("<span>new: </span>").append(createNewInput)

    // }
    function newPanel(configuration: conf.PanelConf) {
        let list = createList().addClass("panel user-panel").appendTo("#main")
        let header = editableHeader(configuration.filter, "All Tasks", () => updateCall()).appendTo(list)
        $("<div>").addClass("panel-header").appendTo(list)
            .append(showHideButton(list, configuration.shown, shown => {
                configuration.shown = shown;
                conf.saveCurrentPath()
            }))
            .append(header)

        let createNewField = $("<div>").addClass("new-entry-field flex-field").appendTo(list)
        let filters: { (element: Data.TodoEntry): boolean }[] = []
        let parse = new Data.TodoEntry("")
        let updateCall = () => {
            list.children(".todo-entry").remove()
            filters = []
            configuration.filter = header.children("input").val() as string
            parse = Data.TodoEntry.fromString(configuration.filter)
            if (parse != null) {
                if (parse.priority != "") filters.push((element) => element.priority == parse.priority)
                if (parse.title != "") filters.push((element) => element.title.startsWith(parse.title))
                for (let item of parse.projects) filters.push((element) => element.projects.includes(item))
                for (let item of parse.resources) filters.push((element) => element.resources.includes(item))

            }
            itemLoop:
            for (let item of Data.entries) {
                for (let filter of filters) {
                    if (!filter(item)) continue itemLoop
                }
                createListEntry(item).appendTo(list)
            }
            conf.saveCurrentPath()
        }
        updateCalls.push(updateCall)
        let createNewInput = $("<input>").addClass("grow")
        createNewInput.keydown((e) => {
            if (e.which == 13) {
                let newEntry = Data.TodoEntry.fromString(createNewInput.val() as string)
                if (newEntry != null) {
                    newEntry.append(parse)
                    Data.addEntry(newEntry)
                    saveStateIndicator("unsaved")
                    saveData()
                    update()
                    createNewInput.val("").focus()
                }
            }
        })
        createNewField.append("<span>new: </span>").append(createNewInput)
    }

    export function update() {
        $(".todo-entry").remove()
        Data.entries.forEach((entry) => {
            let item = createListEntry(entry).appendTo("#main-list")
        })
        for (let call of updateCalls) call()
    }
    export function fullUpdate() {
        for (let thing of Object.keys(conf.current.display)) {
            $(`input.display-${thing}`).prop("checked", conf.current.display[thing])
        }
        $(".user-panel").remove()
        for (let panel of conf.current.panels) {
            newPanel(panel)
        }
        mainFileField.setPath(conf.current.mainFile)
        $("#settings").toggleClass("collapsed", !conf.current.settingsShown)
        update()
    }
    let latestPath = ""
    $("#openBtn").click(() => {
        file.open((path) => {
            update()
            latestPath = path
        })
    })
    $("#saveAsBtn").click(() => {
        file.save()
    })
    $("#saveBtn").click(() => {
        if (latestPath != "") file.write(latestPath)
        else file.save()
    })
    $("#newPanelBtn").click(() => {
        let newConf = new conf.PanelConf()
        conf.current.panels.push(newConf)
        newPanel(newConf)
        conf.saveCurrentPath()
    })

    let mainFileField: UIElements.FileField
    {
        let container = $("#settings")
        $("<div>").addClass("panel-header").append(showHideButton(container, conf.current.settingsShown, shown => {
            conf.current.settingsShown = shown;
            conf.saveCurrentPath()
        })).append("<h1>Settings</h1>").appendTo(container)
        container.append("<h2>Show</h2>")
        for (let thing of Object.keys(conf.current.display)) {
            let checkbox = $(`<input type="checkbox" id="display-${thing}">`).prop("checked", true)
            checkbox.change(() => {
                let checked = checkbox.prop("checked")
                if (checked) {
                    $("body").removeClass("hide-" + thing)
                } else {
                    $("body").addClass("hide-" + thing)
                }
                conf.current.display[thing] = checked
                conf.saveCurrentPath()
            })
            $("<div>").appendTo(container)
                .append(checkbox)
                .append($(`<label for="display-${thing}">${thing}</label>`))
        }

        container.append("<h2>Files</h2>")
        mainFileField = new UIElements.FileField((path) => {
            if (conf.current.mainFile != "") {
                // Store previous file
                file.write(conf.current.mainFile, err => {
                    if (err) {
                        console.log("Error on writing previous file: " + err)
                        let choice = dialog.showMessageBoxSync({
                            type: "error",
                            message: "Error on savng previous file. Continue opening new file? Changes might get lost.",
                            detail: `Error details: ${err}`,
                            buttons: ["Continue", "Cancel"],
                            defaultId: 1,
                            cancelId: 1,
                        })
                        if (choice == 1) return;
                    }
                    // Read new File

                    if (fs.statSync(path).isFile()) {
                        file.read(path, err => {
                            if (err) {
                                alert("Could not read file")
                                mainFileField.setPath(null)
                                return;
                            }
                            conf.current.mainFile = path
                            conf.saveCurrentPath()
                            update()
                        })
                    } else {
                        Data.clear()
                        file.write(path, err => {
                            if (err) {
                                alert("Could not create file")
                                mainFileField.setPath(null)
                                return;
                            }
                            conf.current.mainFile = path
                            conf.saveCurrentPath()
                            update()
                        })
                    }
                })
            } else {
                // Read new File
                conf.current.mainFile = path
                file.read(path, err => {
                    if (err) {
                        alert("Could not read file")
                        mainFileField.setPath(null)
                        return;
                    }
                    conf.saveCurrentPath()
                    update()
                })
            }
        })
        $("<div class='flex-field'></div>").appendTo(container)
            .append("<label>Todo file:</label>")
            .append(mainFileField.element.addClass("grow"))
    }
    conf.loadDefault(() => fullUpdate())

    function saveStateIndicator(state: string) {
        for (let s of ["saved", "unsaved", "error"])
            $("#save-state-indicator").toggleClass("save-" + s, state == s)
    }
    function saveData() {
        file.write(conf.current.mainFile,err => {
            if(err) saveStateIndicator("error")
            else saveStateIndicator("saved")
        })
    }
}
