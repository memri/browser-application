Object.assign(String.prototype, {
    camelCaseToWords() {
        return this.toString().replace(/([A-Z])/g, " $1");
    },

    capitalizingFirst() {
        let result = this.toString();
        return result.charAt(0).toUpperCase() + result.slice(1);
    },

    strippingHTMLtags() {
        return this.toString().replace(/<style[^>]*>.*<\/style>/gs, '').replace(/<script[^>]*>.*<\/script>/gs, '').replace(/(<([^>]+)>)/gi, "").replace(/&nbsp;/gi, " ");
    },
    titleCase() {
        return this.toString().split(/\s+/).map((el) => el.capitalizingFirst()).join(" ");
    }
})

Object.defineProperty(String.prototype, "nilIfBlankOrSingleLine",{
    // Return nil if string is only whitespace and has no newlines
    get() {
        let string = this.toString();
        return /^[\t\v\f ]*$/s.test(string) ? null : string;
    }
});

Object.defineProperty(String.prototype, "nilIfBlank",{
    // Return nil if string is only whitespace
    get() {
        let string = this.toString();
        return /^\s*$/s.test(string) ? null : string;
    }
});