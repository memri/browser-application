export class Color {
    value;

    constructor(value) {
        if (value) {
            if (value.charAt(0) == "#") {
                this.value = Color.hex(value);
            } else {
                this.value = Color.system(value);
                if (!this.value) {
                    this.value = Color.hex(value);
                }
            }
        }
    }

    toLowerCase() {
        return this.value.toLowerCase();
    }

    static system(value) {
        switch (value) {
            case "secondary":
            case "secondaryLabel":
                return "#3c3c4399";
            case "primary":
            case "label":
                return "#000000"
            case "tertiary":
            case "tertiaryLabel":
                return "#3c3c434c"
            case "tertiaryBackground":
            case "tertiarySystemBackground":
                return "#ffffff";
            case "systemFill":
                return "#7878805bb"
            case "secondaryBackground":
            case "secondarySystemBackground":
                return "#f2f2f7ff";
            case "secondarySystemGroupedBackground":
            case "background":
            case "systemBackground":
            case "white":
                return "#ffffff";
            case "black":
                return "#000000";
            case "MemriUI-purpleBack":
                return "#543184";
            case "MemriUI-purpleBackSecondary":
                return "#532a84";
            case "blue":
            case "systemBlue":
                return "#007aff"
            case "red":
            case "systemRed":
                return "#ff3b30"
            case "orange":
            case "systemOrange":
                return "#ff9500"
            case "yellow":
            case "systemYellow":
                return "#ffcc00"
            case "green":
            case "systemGreen":
                return "#34c759"
            case "greenBackground":
                return "#dbf7c5"
            case "purpleBackground":
                return "#efe4fd"
        }
    }

    static named = Color.system;

    static hex(value) {
        if (value.charAt(0) == "#") {//"#f2f2f7f"
            return value;
        } else {
            return "#" + value;
        }
    }

    opacity(value) {
        if (this.value) return this.value + Math.ceil(255 * value).toString(16);
    }

}

export var CVUColor = Color;