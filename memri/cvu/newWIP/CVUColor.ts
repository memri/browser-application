export class Color {
    value;
    constructor(value) {
        switch (value) {
            case "secondaryLabel":
                this.value = "#3c3c4399";
                break;
            case "label":
                this.value = "#000000"
                break;
            case "systemFill":
                this.value = "#7878805bb"
                break;
            case "secondarySystemBackground":
                this.value = "#f2f2f7ff";
                break;
            case "secondarySystemGroupedBackground":
            case "systemBackground":
            case "white":
                this.value = "#ffffff";
                break;
            case "black":
                this.value = "#000000";
                break;
            default:
                if (value.charAt(0) == "#") {//"#f2f2f7f"
                    /*if (value.length == 4) {
                        this.value = value.charAt(0) + value.charAt(1) + value.charAt(1) + value.charAt(2) + value.charAt(2) + value.charAt(3) + value.charAt(3);
                    } else {*/
                    this.value = value;
                    //}
                } else {
                    /*if (value.length == 3) {
                        this.value = "#" + value.charAt(0) + value.charAt(0) + value.charAt(1) + value.charAt(1) + value.charAt(2) + value.charAt(2);
                    } else {*/
                    this.value = "#" + value;
                    //}
                }
                break;
        }
    }
    toLowerCase(){
        return this.value.toLowerCase();
    }

    static system(value) {
        switch (value) {
            case "secondaryLabel":
                return "#3c3c4399";
            case "label":
                return "#000000"
            case "systemFill":
                return "#7878805bb"
            case "secondarySystemBackground":
                return "#f2f2f7ff";
            case "secondarySystemGroupedBackground":
            case "systemBackground":
            case "white":
                return "#ffffff";
            case "black":
                return "#000000";
        }
    }

    static hex(value) {
        if (value.charAt(0) == "#") {//"#f2f2f7f"
           return value;
        } else {
            return  "#" + value;
        }
    }

}

export var CVUColor = Color;