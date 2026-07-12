import * as httpClient from "request-promise";
import { Cookie, CookieJar, Store } from "tough-cookie";
import { DefaultHTTPHeader } from "../const/HTTP";
import { ZhihuDomain } from "../const/URL";
import {
    getCookieJar,
    getCookieStore,
    clearCookieStore,
    persistCookieStore,
} from "../global/cookie";
import { Output } from "../global/logger";
import { IProfile } from "../model/target/target";

interface CacheItem {
    url: string;
    data: any;
}

const DefaultZhihuUrl = "https://www.zhihu.com/";
const CookieAttributeNames = [
    "domain",
    "path",
    "expires",
    "max-age",
    "secure",
    "httponly",
    "samesite",
];

export class HttpService {
    public profile: IProfile;
    public xsrfToken: string;
    public cache = {};

    constructor() {}

    public async sendRequest(options): Promise<any> {
        if (options.headers == undefined || options.headers == null) {
            options.headers = Object.assign({}, DefaultHTTPHeader);
            try {
                options.headers["cookie"] = getCookieJar().getCookieStringSync(
                    options.uri
                );
            } catch (error) {
                console.log(error);
            }
        }
        if (this.xsrfToken) {
            options.headers["x-xsrftoken"] = this.xsrfToken;
        }
        options.headers["cookie"] = getCookieJar().getCookieStringSync(
            options.uri
        );
        if (options.uri && options.uri.indexOf("/api/v4/me") >= 0) {
            const cookieNames = options.headers["cookie"]
                ? options.headers["cookie"].split(";").map((cookie) => cookie.trim().split("=")[0])
                : [];
            Output(`请求 ${options.uri} 携带 Cookie: ${cookieNames.join(", ") || "(none)"}`);
        }
		// TODO 暂时删除导致json乱码的压缩方式
        if (!options.isGzip) {
            delete options.headers["accept-encoding"];
        }
        // options.headers['cookie'] = getCookieJar().getCookieStringSync('www.zhihu.com');
        // headers['cookie'] = cookieService.getCookieString(options.uri);
        var returnBody;
        if (
            options.resolveWithFullResponse == undefined ||
            options.resolveWithFullResponse == false
        ) {
            returnBody = true;
        } else {
            returnBody = false;
        }
        options.resolveWithFullResponse = true;

        options.simple = false;

        var resp;
        if (!this.cache) this.cache = {};
        try {
            if (this.cache[options.uri]) {
                // cache hit
                resp = this.cache[options.uri];
            } else {
                // cache miss
                resp = await httpClient(options);
                if (resp.headers["set-cookie"]) {
                    resp.headers["set-cookie"]
                        .map((c) => Cookie.parse(c))
                        .forEach((c) => {
                            // delete c.domain
                            getCookieJar().setCookieSync(c, options.uri);
                            getCookieStore().findCookie(
                                ZhihuDomain,
                                "/",
                                "_xsrf",
                                (err, c) => {
                                    if (c) {
                                        this.xsrfToken = c.value;
                                    }
                                }
                            );
                        });
                }
                if (options.enableCache) {
                    this.cache[options.uri] = resp;
                }
            }
        } catch (error) {
            // vscode.window.showInformationMessage('请求错误');
            Output(error);
            if (error && error.statusCode) {
                Output(`请求失败状态码: ${error.statusCode}`);
            }
            if (error && error.message) {
                Output(`请求失败信息: ${error.message}`);
            }
            return Promise.resolve(null);
        }
        if (returnBody) {
            return Promise.resolve(resp.body);
        } else {
            return Promise.resolve(resp);
        }
    }

    public clearCookie(domain?: string) {
        if (domain == undefined) {
            const store: any = getCookieStore();
            store.idx = {};
            clearCookieStore();
        } else {
            getCookieStore().removeCookies(domain, null, (err) => {
                if (err) {
                    console.log(err);
                }
            });
        }
        this.xsrfToken = undefined;
    }

    public clearCache() {
        this.cache = {};
    }

    public applyCookieHeader(cookieHeader: string, currentUrl: string = DefaultZhihuUrl) {
        if (!cookieHeader) {
            return;
        }

        const isCdpCookieHeader = cookieHeader.includes("\n");
        const rawCookies = isCdpCookieHeader
            ? cookieHeader.split(/\r?\n/)
            : cookieHeader.replace(/^cookie:\s*/i, "").split(";");
        const cookies = rawCookies
            .map((cookie) => cookie.trim())
            .filter((cookie) => cookie.includes("="))
            .filter((cookie) => isCdpCookieHeader || !CookieAttributeNames.includes(cookie.split("=")[0].trim().toLowerCase()))
            .map((cookie) => isCdpCookieHeader ? parseCdpCookie(cookie) : Cookie.parse(cookie))
            .filter((cookie) => !!cookie);

        cookies.forEach((cookie) => {
            cookie.domain = cookie.domain ? cookie.domain.replace(/^\./, "") : ZhihuDomain;
            cookie.path = cookie.path || "/";
            (cookie as any).hostOnly = false;
        });
        const store: any = getCookieStore();
        store.idx = store.idx || {};
        cookies.forEach((cookie) => {
            store.idx[cookie.domain] = store.idx[cookie.domain] || {};
            store.idx[cookie.domain][cookie.path] = store.idx[cookie.domain][cookie.path] || {};
            store.idx[cookie.domain][cookie.path][cookie.key] = cookie;
        });
        persistCookieStore();
        Output(`已写入 CookieJar: ${cookies.map((cookie) => `${cookie.key}@${cookie.domain}${cookie.path}`).join(", ")}`);

        const xsrfCookie = cookies.find((cookie) => cookie.key === "_xsrf");
        if (xsrfCookie) {
            this.xsrfToken = xsrfCookie.value;
        }
    }
}

function parseCdpCookie(rawCookie: string): Cookie {
    const parts = rawCookie.split(";").map((part) => part.trim()).filter((part) => !!part);
    const firstEquals = parts[0].indexOf("=");
    if (firstEquals < 1) {
        return undefined;
    }
    const cookie = new Cookie({
        key: parts[0].slice(0, firstEquals),
        value: parts[0].slice(firstEquals + 1),
        domain: ZhihuDomain,
        path: "/",
    });
    parts.slice(1).forEach((part) => {
        const attrEquals = part.indexOf("=");
        const attrName = (attrEquals >= 0 ? part.slice(0, attrEquals) : part).trim().toLowerCase();
        const attrValue = attrEquals >= 0 ? part.slice(attrEquals + 1).trim() : "";
        if (attrName === "domain" && attrValue) {
            cookie.domain = attrValue.replace(/^\./, "");
            (cookie as any).hostOnly = false;
        } else if (attrName === "path" && attrValue) {
            cookie.path = attrValue;
        }
    });
    return cookie;
}

var httpService = new HttpService();

export const sendRequest = (options) => httpService.sendRequest(options);
export const clearCookie = (domain?: string) => httpService.clearCookie(domain);
export const clearCache = () => httpService.clearCache();
export const applyCookieHeader = (cookieHeader: string, currentUrl?: string) =>
    httpService.applyCookieHeader(cookieHeader, currentUrl);
