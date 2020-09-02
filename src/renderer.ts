import $ = require("jquery");
import { data } from "jquery";
import { listenerCount } from "process";

namespace UI {
    function createListEntry(entry: Data.TodoEntry): JQuery {
        let listEntry = $("<div>").addClass("todo-entry done-" + entry.done).data("entry", entry).attr("tabindex", "0")
        /** Toggle done-status */
        let checkEvent = () => {
            Data.removeEntry(entry)
            entry.done = !entry.done
            Data.addEntry(entry)
            listEntry.addClass("done-" + entry.done)
            listEntry.removeClass("done-" + !entry.done)
            saveStateIndicator("unsaved")
            update()
            saveData()
        }
        /** Decide selection state */
        let selectEvent = (single: boolean) => {
            let wasSelected = listEntry.hasClass("selected")
            if (single) listEntry.parent().children(".todo-entry").removeClass("selected")
            if (listEntry.hasClass("selected") == wasSelected) listEntry.toggleClass("selected")
        }
        let editEvent = () => {
            let w = listEntry.parent().width()
            let h = listEntry.height()
            let input = $("<textarea>").val(entry.toString()).appendTo(listEntry).focus().width(w).height(h)
            input.keydown((e) => {
                //if(e.target !== input.get(0)) return true;
                if (e.which == 13) { // Enter
                    let newEntry = Data.TodoEntry.fromString(input.val() as string)
                    console.log(newEntry)
                    if(newEntry != null){
                        Data.removeEntry(entry)
                        Data.addEntry(newEntry)
                        saveStateIndicator("unsaved")
                        update()
                        saveData()
                    } else {
                        input.addClass("error")
                    }
                    return false;
                } else if (e.which == 27) { // Escape = Cancel
                    listEntry.children("span").css("display","")
                    input.remove()
                    return false;
                }
                e.stopPropagation()
            })
            listEntry.children("span").css("display","none")
        }
        listEntry
            .mousedown((e) => selectEvent(!e.shiftKey && !e.ctrlKey))
            .dblclick(e => editEvent())
            .keydown(e => {
                //if(e.target !== listEntry.get(0)) return true;
                if (e.which == 13) { // x is pressed
                    checkEvent()
                } else if (e.which == 32) { //
                    selectEvent(!e.shiftKey && !e.ctrlKey)
                } else if (e.which == 113) {
                    editEvent()
                } else return
                e.stopPropagation()
                e.preventDefault()
            })
        $("<span>").addClass("prio").text(entry.priority).appendTo(listEntry)
        $("<span>").addClass("title").text(entry.title).appendTo(listEntry)
        for (let item of entry.projects) $("<span>").addClass("project").text(item).appendTo(listEntry)
        for (let item of entry.resources) $("<span>").addClass("resource").text(item).appendTo(listEntry)
        for (let item in entry.properties)
            $("<span>").addClass("property").appendTo(listEntry)
                .append($("<span>").text(item).addClass("name"))
                .append($("<span>").text(entry.properties[item]).addClass("value"))
        $("<span>").text("x").addClass("check-button").click(e => {
            checkEvent()
            e.stopPropagation()
        }).appendTo(listEntry)

        return listEntry
    }
    function createList(): JQuery {
        let result = $("<div>").addClass("list")
        result.focusout((e) => {
            setTimeout(function () { // needed because nothing has focus during 'focusout'
                if (!$(':focus').parent().is(result)) {
                    result.children(".todo-entry").removeClass("selected")
                }
            }, 0);
        })
        result.keydown((e) => {
            //if(e.target !== result.get(0)) return true;
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

    function newPanel(configuration: conf.PanelConf) {
        let panel = $("<div>").addClass("panel user-panel").appendTo("#main").attr("tabindex", 0)
        let panelTitle = new UIElements.EditableTitle(configuration.filter, "All Tasks", (value) => {
            configuration.filter = value
            // Update all panels to support panels based on other panels, like %remains
            update()
        })
        panelTitle.container.addClass("editable-header")
        $("<div>").addClass("panel-header").appendTo(panel)
            .append(showHideButton(panel, configuration.shown, shown => {
                configuration.shown = shown;
                conf.saveCurrentPath()
            }))
            .append(panelTitle.container)

        panel.keydown((e) => {
            if (e.key == "Delete" && e.target == panel.get(0)) {
                console.log("delete")
                conf.current.panels.splice(conf.current.panels.indexOf(configuration), 1)
                conf.saveCurrentPath()
                panel.remove()
                return false;
            } else if (e.which == 113) { //F2
                panelTitle.startEdit()
                return false;
            }
        })

        let createNewField = $("<div>").addClass("new-entry-field flex-field").appendTo(panel)
        let list = createList().appendTo(panel)
        let filter: Filters.Filter
        let updateCall = () => {
            list.children(".todo-entry").remove()
            filter = Filters.fromString(configuration.filter)
            let additionalFilter: Filters.FilterFn = null
            if (filter.remainsOnly) {
                let excludedFilters: Filters.Filter[] = []
                for (let otherPanel of conf.current.panels) {
                    if (otherPanel.filter == "") continue;
                    let otherFilter = Filters.fromString(otherPanel.filter)
                    if (!otherFilter.remainsOnly) excludedFilters.push(otherFilter)
                }
                additionalFilter = (entry) => {
                    for (let otherFilter of excludedFilters) {
                        if (otherFilter.apply(entry)) return false
                    }
                    return true
                }
            }
            for (let item of Data.entries) {
                if (!filter.apply(item)) continue
                if (additionalFilter != null && !additionalFilter(item)) continue
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
                    newEntry.append(filter.templateEntry)
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
        showSettings(conf.current.settingsShown)
        showHelp(conf.current.helpShown)
        $("#help").children("details").each((i, el) => {
            let name = $(el).children("summary").text()
            if (conf.current["help" + name] !== undefined) {
                $(el).prop("open", conf.current["help" + name])
            }
        })
        update()
    }
    function showSettings(shown: boolean) {
        $("#settings").toggleClass("collapsed", !shown)
        $("#settingsBtn").toggleClass("toggled", shown)
        conf.current.settingsShown = shown
        conf.saveCurrentPath()
    }
    function showHelp(shown: boolean) {
        $("#help").toggleClass("collapsed", !shown)
        $("#helpBtn").toggleClass("toggled", shown)
        conf.current.helpShown = shown
        conf.saveCurrentPath()
    }
    let latestPath = ""
    $("#newPanelBtn").click(() => {
        let newConf = new conf.PanelConf()
        conf.current.panels.push(newConf)
        newPanel(newConf)
        conf.saveCurrentPath()
    })

    { // Help
        let container = $("#help").addClass("hide-on-collapsed")
        $("#helpBtn").click(() => {
            showHelp(!conf.current.helpShown)
        })
        container.children(".panel-header").append(showHideButton(container, conf.current.helpShown, shown => {
            showHelp(shown)
        })).append("<h1>Help</h1>")
        container.children("details").each((i, el) => {
            let element = $(el)
            let name = element.children("summary").text()

            if (conf.current["help" + name] == undefined) {
                conf.current["help" + name] = true
                conf.saveCurrentPath()
            }
            element.prop("open", conf.current["help" + name])
            element.mouseup(e => {
                setTimeout(function () { // needed because details tag closes later
                    conf.current["help" + name] = element.prop("open")
                    conf.saveCurrentPath()
                }, 0)

            })
        })
    }

    let mainFileField: UIElements.FileField
    { // Settings
        $("#settingsBtn").click(() => {
            showSettings(!conf.current.settingsShown)
        })
        let container = $("#settings").addClass("hide-on-collapsed")
        $("<div>").addClass("panel-header").append(showHideButton(container, conf.current.settingsShown, shown => {
            showSettings(shown)
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
        file.write(conf.current.mainFile, err => {
            if (err) saveStateIndicator("error")
            else saveStateIndicator("saved")
        })
    }
}
