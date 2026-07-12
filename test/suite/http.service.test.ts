import * as assert from "assert";
import { Cookie } from "tough-cookie";
import {
    applyCookieHeader,
    clearCache,
    clearCookie,
    sendRequest,
} from "../../src/service/http.service";
import { getCookieJar } from "../../src/global/cookie";

suite("Http Service Test", () => {
    setup(() => {
        clearCookie();
        clearCache();
    });

    test("exported sendRequest keeps HttpService context", async () => {
        const resp = await sendRequest({
            uri: "http://127.0.0.1:9/",
            enableCache: true,
            headers: {},
            timeout: 50,
        });

        assert.strictEqual(resp, null);
    });

    test("applyCookieHeader stores browser cookie text in cookie jar", () => {
        applyCookieHeader("z_c0=token-value; _xsrf=xsrf-value; d_c0=device-value");

        const cookieHeader = getCookieJar().getCookieStringSync("https://www.zhihu.com/");
        const cookies = cookieHeader.split("; ").map((raw) => Cookie.parse(raw));
        const cookieNames = cookies.map((cookie) => cookie.key);

        assert.ok(cookieNames.includes("z_c0"));
        assert.ok(cookieNames.includes("_xsrf"));
        assert.ok(cookieNames.includes("d_c0"));
    });

    test("applyCookieHeader makes browser cookies available to zhihu subdomains", () => {
        applyCookieHeader("z_c0=token-value; _xsrf=xsrf-value; d_c0=device-value");

        assert.ok(getCookieJar().getCookieStringSync("https://www.zhihu.com/api/v4/me").includes("z_c0=token-value"));
        assert.ok(getCookieJar().getCookieStringSync("https://api.zhihu.com/images").includes("z_c0=token-value"));
        assert.ok(getCookieJar().getCookieStringSync("https://zhuanlan.zhihu.com/api/articles").includes("z_c0=token-value"));
    });

    test("clearCookie removes imported browser cookies from zhihu hosts", () => {
        applyCookieHeader("z_c0=token-value; _xsrf=xsrf-value; d_c0=device-value");
        clearCookie();

        assert.strictEqual(getCookieJar().getCookieStringSync("https://www.zhihu.com/api/v4/me"), "");
        assert.strictEqual(getCookieJar().getCookieStringSync("https://api.zhihu.com/images"), "");
        assert.strictEqual(getCookieJar().getCookieStringSync("https://zhuanlan.zhihu.com/api/articles"), "");
    });
});
