'use strict';
const dialog = require('electron').remote.dialog;
const app = require('electron').remote.app;
const fs = require('fs');
const path = require("path");

/**
 * Functions for loading and saving todo entries
 */
namespace file {
    export function save (callback?: { (err: any, path: string): void }) {
        let fileName = dialog.showSaveDialogSync({
            filters: [{ name: "Text-File", extensions: [".txt"] }]
        });

        if (fileName === undefined) {
            console.log("No file selected");
            return;
        }
        // fileName is a string that contains the path and filename created in the save file dialog.  
        file.write(fileName, callback ? (err) => callback(err, fileName) : null)
    }
    export function write (fileName: string, callback?: { (err: any): void }) {
        fs.writeFile(fileName, Data.toString(), (err: any) => {
            if (err) {
                alert("An error occurred creating / writing to the file " + err.message)
            }
            if (callback) callback(err)
        });
    }
    export function open (callback?: { (err: any, path: string): void }) {
        let fileNames = dialog.showOpenDialogSync({
            properties: ['openFile'],
            filters: [{ name: "Textfile", extensions: ["txt"] }, { name: "All Files", extensions: ["*"] }]
        });

        if (fileNames === undefined || fileNames.length < 1) {
            console.log("No file selected");
            return
        }
        file.read(fileNames[0], callback ? (err) => callback(err, fileNames[0]) : null)

    }
    export function read (path: string, callback?: { (err: any): void }) {
        fs.readFile(path, "utf-8", (err: any, d: string) => {
            Data.clear()
            Data.fromString(d)
            if (callback != null) callback(err)
        });
    }
}
