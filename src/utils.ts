namespace Utils {
    export function removeFromString(input: string, startIndex: number, length: number) {
        return input.substr(0, startIndex) + input.substr(startIndex + length)
    }
}