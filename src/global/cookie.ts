import { getExtensionPath } from "./globa-var";
import * as path from "path"
import * as FileCookieStore from "tough-cookie-filestore";
import { CookieJar, Store } from "tough-cookie";
import { writeFileSync } from "fs";

var store: Store;
var cookieJar: CookieJar;

export function getCookieStore() {
    loadCookie()
    return store
}

export function clearCookieStore() {
    writeFileSync(path.join(getExtensionPath(), './cookie.json'), '{}');
}

export function persistCookieStore() {
    writeFileSync(path.join(getExtensionPath(), './cookie.json'), JSON.stringify(store ? (store as any).idx : {}));
}

export function getCookieJar() {
    loadCookie()
    return cookieJar
}

function loadCookie() {
    if (!store) {
        const cookiePath = path.join(getExtensionPath(), './cookie.json');
        try {
            store = new FileCookieStore(cookiePath);
        } catch (error) {
            writeFileSync(cookiePath, '{}');
            store = new FileCookieStore(cookiePath);
        }
    }
    if (!cookieJar) {
        cookieJar = new CookieJar(store);
    }
}
