import * as assert from "assert";
import { removeSyncWatermark } from "../../src/util/md-html-utils";

suite("Markdown Html Utils Test", () => {
    test("remove sync watermark footer and image watermark attributes", () => {
        const html = [
            '<p><img src="https://pic4.zhimg.com/80/v2-test_1440w.png" data-caption="" data-size="normal" data-watermark="original" data-original-src="https://pic4.zhimg.com/80/v2-test_r.png"/></p>',
            '<p><img src="https://pic4.zhimg.com/50/v2-test_hd.jpg" data-default-watermark-src="https://pic4.zhimg.com/50/v2-watermark_hd.jpg"/></p>',
            '<blockquote><p>本文使用 <a href="https://zhuanlan.zhihu.com/p/106057556">Zhihu On VSCode</a> 创作并发布</p></blockquote>',
        ].join("");

        const result = removeSyncWatermark(html);

        assert.equal(result.includes("data-watermark"), false);
        assert.equal(result.includes("data-default-watermark-src"), false);
        assert.equal(result.includes("Zhihu On VSCode"), false);
    });
});
