import * as assert from "assert";
import { WebviewService } from "../../src/service/webview.service";

suite("Webview Service Test", () => {
    test("actualSrcNormalize tolerates empty content", () => {
        const service = new WebviewService(undefined as any, undefined as any) as any;

        assert.strictEqual(service.actualSrcNormalize(undefined), "");
        assert.strictEqual(service.actualSrcNormalize("<noscript>x</noscript><p>ok</p>"), "x<p>ok</p>");
    });
});
