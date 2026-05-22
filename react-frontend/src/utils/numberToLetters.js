export function NumberToLetter(valeur) {
    if (isNaN(valeur) || valeur === null || valeur === undefined) return "";
    
    const unites = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf"];
    const dix = ["", "dix", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante-dix", "quatre-vingt", "quatre-vingt-dix"];
    const dizaines = ["dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
    
    function convertGroup(n) {
        let res = "";
        let c = Math.floor(n / 100);
        let r = n % 100;
        let d = Math.floor(r / 10);
        let u = r % 10;
        
        if (c > 0) {
            if (c === 1) res += "cent ";
            else res += unites[c] + " cent " + (r === 0 ? "s " : "");
        }
        
        if (d === 0) {
            if (u > 0) res += unites[u] + " ";
        } else if (d === 1) {
            res += dizaines[u] + " ";
        } else if (d === 7) {
            res += "soixante-" + dizaines[u] + " ";
        } else if (d === 9) {
            res += "quatre-vingt-" + dizaines[u] + " ";
        } else {
            res += dix[d] + " ";
            if (u === 1 && d !== 8) res += "et un ";
            else if (u > 0) res += unites[u] + " ";
        }
        return res.trim();
    }
    
    let entier = Math.floor(valeur);
    let decimal = Math.round((valeur - entier) * 100);
    
    if (entier === 0) return "zéro dirham" + (decimal > 0 ? " et " + convertGroup(decimal) + " centime" + (decimal > 1 ? "s" : "") : "");
    
    let str = "";
    let milliards = Math.floor(entier / 1000000000);
    entier %= 1000000000;
    let millions = Math.floor(entier / 1000000);
    entier %= 1000000;
    let milliers = Math.floor(entier / 1000);
    let rest = entier % 1000;
    
    if (milliards > 0) {
        str += convertGroup(milliards) + " milliard" + (milliards > 1 ? "s " : " ");
    }
    if (millions > 0) {
        str += convertGroup(millions) + " million" + (millions > 1 ? "s " : " ");
    }
    if (milliers > 0) {
        if (milliers === 1) str += "mille ";
        else str += convertGroup(milliers) + " mille ";
    }
    if (rest > 0) {
        str += convertGroup(rest) + " ";
    }
    
    str += "dirham" + (Math.floor(valeur) > 1 ? "s" : "");
    
    if (decimal > 0) {
        str += " et " + convertGroup(decimal) + " centime" + (decimal > 1 ? "s" : "");
    }
    
    // Capitalize first letter
    str = str.trim();
    return str.charAt(0).toUpperCase() + str.slice(1);
}
