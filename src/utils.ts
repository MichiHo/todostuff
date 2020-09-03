namespace Utils {
    export function removeFromString(input: string, startIndex: number, length: number) {
        return input.substr(0, startIndex) + input.substr(startIndex + length)
	}
	export function hexToRgb(hex:string) : {r:number,g:number,b:number}|null {
		var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result ? {
		  r: parseInt(result[1], 16),
		  g: parseInt(result[2], 16),
		  b: parseInt(result[3], 16)
		} : null;
	  }
}