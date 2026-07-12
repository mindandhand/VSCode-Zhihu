import * as assert from "assert";
import {
    buildCookieHeader,
    findBrowserExecutable,
} from "../../src/service/browser-cookie-login.service";

suite("Browser Cookie Login Service Test", () => {
    test("buildCookieHeader keeps all zhihu cookies from CDP cookies", () => {
        const cookieHeader = buildCookieHeader([
            { name: "SESSIONID", value: "session-value", domain: ".zhihu.com", path: "/" },
            { name: "z_c0", value: "token-value", domain: ".zhihu.com", path: "/" },
            { name: "_xsrf", value: "xsrf-value", domain: ".zhihu.com", path: "/" },
            { name: "d_c0", value: "device-value", domain: ".zhihu.com", path: "/" },
            { name: "unrelated", value: "ignored", domain: ".example.com", path: "/" },
            { name: "passport_only", value: "ignored", domain: "passport.zhihu.com", path: "/" },
        ]);

        assert.strictEqual(cookieHeader, [
            "SESSIONID=session-value; Domain=.zhihu.com; Path=/",
            "z_c0=token-value; Domain=.zhihu.com; Path=/",
            "_xsrf=xsrf-value; Domain=.zhihu.com; Path=/",
            "d_c0=device-value; Domain=.zhihu.com; Path=/",
        ].join("\n"));
    });

    test("buildCookieHeader returns empty when z_c0 is missing", () => {
        const cookieHeader = buildCookieHeader([
            { name: "_xsrf", value: "xsrf-value", domain: ".zhihu.com", path: "/" },
            { name: "d_c0", value: "device-value", domain: ".zhihu.com", path: "/" },
        ]);

        assert.strictEqual(cookieHeader, "");
    });

    test("findBrowserExecutable prefers Chrome on macOS", () => {
        const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
        const edgePath = "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge";

        const executable = findBrowserExecutable("darwin", (candidate) => {
            return candidate === chromePath || candidate === edgePath;
        });

        assert.strictEqual(executable, chromePath);
    });
});
