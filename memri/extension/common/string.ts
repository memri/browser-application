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
    }
})