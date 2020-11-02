Object.assign(String.prototype, {
    camelCaseToWords() {
        return this.toString().replace(/([A-Z])/g, " $1");
    },

    capitalizingFirst() {
        let result = this.toString();
        return result.charAt(0).toUpperCase() + result.slice(1);
    },

    strippingHTMLtags() {
        return this.toString().replace(/<[^<]+>/g, "");
    },
    titleCase() {
        return this.toString().split(/\s+/).map((el) => el.capitalizingFirst()).join(" ");
    },
    // Return nil if string is only whitespace and has no newlines
    get nilIfBlankOrSingleLine() {
        let string = this.toString();
        return /^[\t\v\f ]*$/s.test(string) ? null : string;
    }
})