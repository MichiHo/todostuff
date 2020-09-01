


namespace conf {
    /*
    TODO
    -   load / save
    -   data binding with UI 
    */
    export const defaultConfPath = path.join(app.getAppPath(),"/conf.json")
    export let currentConfPath = ""

    /**
     * Configuration for a single panel
     */
    export class PanelConf {
        constructor(
            public filter: string = "",
            public shown: boolean = true) { }
    }

    export let current: {
        [key: string]: any,
        mainFile: string,
        display: {
            [key: string]: any,
            resources: boolean,
            projects: boolean,
            properties: boolean,
        },
        panels: PanelConf[],
        settingsShown: boolean
    } = {
        mainFile: "",
        display: {
            resources: true,
            projects: true,
            properties: true
        },
        panels: [{
            filter: "",
            shown: true,
        }],
        settingsShown: true
    }
    export function loadDefault(callback?: { (err: any): void }) {
        loadFromFile(defaultConfPath, err => {
            if (err) {
                console.log("Default conf file not found. Creating it.")
                saveToPath(defaultConfPath, callback)
            } else {
                console.log("Default conf file found and loaded")
                if(callback) callback(err)
            }
        })
    }
    export function loadFromFile(path: string, callback?: { (err: any): void }) {
        fs.readFile(path, "utf-8", (err: any, d: string) => {
            if (err) {
                alert("Error opening the conf file " + err.message)
                if (callback) callback(err)
                return;
            }
            current = JSON.parse(d)
            currentConfPath = path
            if (current.mainFile.length > 0)
                file.read(current.mainFile, (err) => {
                    if (err) {
                        console.log("Error loading main file " + err.message)
                        current.mainFile = ""
                        Data.clear()
                    }
                    if (callback) callback(null)
                })
        });
    }
    export function saveCurrentPath(callback?: { (err: any): void }) {
        if (currentConfPath == "") {
            if (callback) callback({ message: "No current conf path set" })
            return;
        }
        saveToPath(currentConfPath, callback)
    }
    export function saveToPath(path: string, callback?: { (err: any): void }) {
        fs.writeFile(path, JSON.stringify(current), (err: any) => {
            if (err) {
                alert("Error creating / writing the conf file " + err.message)
            }
            if (callback) callback(err)
        });
    }
}
