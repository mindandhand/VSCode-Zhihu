import * as childProcess from "child_process";
import * as fs from "fs";
import * as http from "http";
import * as net from "net";
import * as os from "os";
import * as path from "path";
import * as vscode from "vscode";
import { Output } from "../global/logger";

const LoginUrl = "https://www.zhihu.com/signin?next=%2F";
const CookieUrls = [
    "https://www.zhihu.com/",
    "https://api.zhihu.com/",
    "https://zhuanlan.zhihu.com/",
];
const AllowedCookieDomains = [
    "zhihu.com",
    ".zhihu.com",
    "www.zhihu.com",
    ".www.zhihu.com",
    "api.zhihu.com",
    ".api.zhihu.com",
    "zhuanlan.zhihu.com",
    ".zhuanlan.zhihu.com",
];
const LoginCookieName = "z_c0";
const CookieHeaderSeparator = "\n";
const LoginTimeoutMs = 180000;
const PollIntervalMs = 2000;

export interface CdpCookie {
    name: string;
    value: string;
    domain?: string;
    path?: string;
}

interface CdpResponse {
    id?: number;
    result?: any;
    error?: { message?: string };
}

interface BrowserLaunch {
    port: number;
    process: childProcess.ChildProcess;
    userDataDir: string;
}

interface CdpTarget {
    type?: string;
    url?: string;
    webSocketDebuggerUrl?: string;
}

interface BrowserLoginState {
    cookies: CdpCookie[];
    authStatus?: number;
}

export function buildCookieHeader(cookies: CdpCookie[]): string {
    const normalizedCookies = cookies
        .filter((cookie) => !cookie.domain || AllowedCookieDomains.includes(cookie.domain))
        .filter((cookie) => !!cookie.name && !!cookie.value);

    if (!normalizedCookies.some((cookie) => cookie.name === LoginCookieName)) {
        return "";
    }

    return normalizedCookies
        .map((cookie) => {
            const parts = [`${cookie.name}=${cookie.value}`];
            if (cookie.domain) {
                parts.push(`Domain=${cookie.domain}`);
            }
            parts.push(`Path=${cookie.path || "/"}`);
            return parts.join("; ");
        })
        .join(CookieHeaderSeparator);
}

export function findBrowserExecutable(
    platform: NodeJS.Platform = process.platform,
    exists: (candidate: string) => boolean = fs.existsSync
): string | undefined {
    const candidates = getBrowserCandidates(platform);
    return candidates.find((candidate) => {
        if (path.isAbsolute(candidate)) {
            return exists(candidate);
        }
        return true;
    });
}

export async function getCookieHeaderFromLoginBrowser(): Promise<string | undefined> {
    const executable = findBrowserExecutable();
    if (!executable) {
        vscode.window.showWarningMessage("未找到 Chrome 或 Edge，无法自动获取知乎 Cookie。");
        return undefined;
    }

    let browser: BrowserLaunch;
    try {
        browser = await launchBrowser(executable);
    } catch (error) {
        vscode.window.showWarningMessage(`启动浏览器失败：${String(error)}`);
        return undefined;
    }
    Output(`自动登录浏览器已启动: ${executable}, CDP 端口: ${browser.port}`);

    try {
        return await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "请在打开的浏览器窗口完成知乎登录",
            cancellable: false,
        }, async (progress) => {
            progress.report({ message: "等待知乎登录 Cookie..." });
            return waitForZhihuCookie(browser.port, (message) => progress.report({ message }));
        });
    } finally {
        try {
            if (!browser.process.killed) {
                browser.process.kill();
            }
        } catch (error) {
            Output(`清理自动登录浏览器进程失败: ${String(error)}`);
        }
        try {
            removeDirectory(browser.userDataDir);
        } catch (error) {
            Output(`清理自动登录临时目录失败: ${String(error)}`);
        }
    }
}

function getBrowserCandidates(platform: NodeJS.Platform): string[] {
    if (platform === "darwin") {
        return [
            "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
            "/Applications/Chromium.app/Contents/MacOS/Chromium",
        ];
    }
    if (platform === "win32") {
        const programFiles = process.env.PROGRAMFILES || "C:\\Program Files";
        const programFilesX86 = process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)";
        const localAppData = process.env.LOCALAPPDATA || "";
        return [
            path.join(programFiles, "Google\\Chrome\\Application\\chrome.exe"),
            path.join(programFilesX86, "Google\\Chrome\\Application\\chrome.exe"),
            path.join(localAppData, "Google\\Chrome\\Application\\chrome.exe"),
            path.join(programFiles, "Microsoft\\Edge\\Application\\msedge.exe"),
            path.join(programFilesX86, "Microsoft\\Edge\\Application\\msedge.exe"),
        ];
    }
    return ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser", "microsoft-edge"];
}

async function launchBrowser(executable: string): Promise<BrowserLaunch> {
    const port = await getFreePort();
    const userDataDir = path.join(os.tmpdir(), `vscode-zhihu-login-${Date.now()}`);
    fs.mkdirSync(userDataDir, { recursive: true });

    return new Promise((resolve, reject) => {
        const browserProcess = childProcess.spawn(executable, [
            `--remote-debugging-port=${port}`,
            `--user-data-dir=${userDataDir}`,
            "--no-first-run",
            "--no-default-browser-check",
            LoginUrl,
        ], {
            detached: true,
            stdio: "ignore",
        });
        let settled = false;
        browserProcess.once("error", (error) => {
            if (settled) {
                return;
            }
            settled = true;
            removeDirectory(userDataDir);
            reject(error);
        });
        setTimeout(() => {
            if (settled) {
                return;
            }
            settled = true;
            browserProcess.unref();
            resolve({ port, process: browserProcess, userDataDir });
        }, 500);
    });
}

async function waitForZhihuCookie(port: number, report?: (message: string) => void): Promise<string | undefined> {
    const startedAt = Date.now();
    let lastLogAt = 0;
    while (Date.now() - startedAt < LoginTimeoutMs) {
        try {
            const state = await readLoginStateFromCdp(port);
            const cookieHeader = buildCookieHeader(state.cookies);
            const cookieNames = Array.from(new Set(state.cookies.map((cookie) => cookie.name))).sort();
            if (Date.now() - lastLogAt > 10000) {
                Output(`自动登录轮询 Cookie: ${cookieNames.join(", ") || "(none)"}, 浏览器内验证: ${state.authStatus || "unknown"}`);
                lastLogAt = Date.now();
            }
            if (cookieHeader && state.authStatus === 200) {
                Output("自动登录已获取 z_c0 Cookie，且浏览器内验证通过。");
                Output(`自动登录准备返回 Cookie，长度: ${cookieHeader.length}`);
                report && report("已获取登录 Cookie，正在验证...");
                return cookieHeader;
            }
            if (cookieHeader) {
                report && report(`等待知乎确认登录... 浏览器内状态 ${state.authStatus || "unknown"}`);
            } else {
                report && report(`等待 z_c0... 已看到 ${cookieNames.length} 个 Cookie`);
            }
        } catch (error) {
            if (Date.now() - lastLogAt > 10000) {
                Output(`自动登录读取 Cookie 失败: ${String(error)}`);
                lastLogAt = Date.now();
            }
            report && report("等待浏览器调试端口...");
        }
        await delay(PollIntervalMs);
    }
    vscode.window.showWarningMessage("自动获取知乎 Cookie 超时，请确认浏览器窗口中已完成登录。");
    return undefined;
}

async function readLoginStateFromCdp(port: number): Promise<BrowserLoginState> {
    const targets = await getJson<CdpTarget[]>(
        `http://127.0.0.1:${port}/json/list`
    );
    const pageTarget = targets.find((target) =>
        target.type === "page" &&
        target.webSocketDebuggerUrl &&
        (!target.url || target.url.includes("zhihu.com"))
    ) || targets.find((target) => target.type === "page" && target.webSocketDebuggerUrl);
    if (!pageTarget || !pageTarget.webSocketDebuggerUrl) {
        throw new Error("Chrome debugging page target is not ready");
    }
    return getLoginStateOverWebSocket(pageTarget.webSocketDebuggerUrl);
}

function getLoginStateOverWebSocket(webSocketDebuggerUrl: string): Promise<BrowserLoginState> {
    const WebSocket = require("ws");
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(webSocketDebuggerUrl);
        const pending = new Set([1, 2, 3]);
        let allCookies: CdpCookie[] = [];
        let urlCookies: CdpCookie[] = [];
        let authStatus: number | undefined;
        const timeoutId = setTimeout(() => {
            ws.close();
            reject(new Error("CDP cookie request timed out"));
        }, 5000);

        ws.on("open", () => {
            ws.send(JSON.stringify({
                id: 1,
                method: "Network.getAllCookies",
            }));
            ws.send(JSON.stringify({
                id: 2,
                method: "Network.getCookies",
                params: { urls: CookieUrls },
            }));
            ws.send(JSON.stringify({
                id: 3,
                method: "Runtime.evaluate",
                params: {
                    awaitPromise: true,
                    returnByValue: true,
                    expression: `fetch("https://www.zhihu.com/api/v4/me", { credentials: "include" }).then(r => r.status).catch(() => 0)`,
                },
            }));
        });
        ws.on("message", (data) => {
            const response: CdpResponse = JSON.parse(data.toString());
            if (!response.id || !pending.has(response.id)) {
                return;
            }
            pending.delete(response.id);
            if (response.error) {
                Output(`CDP Cookie 方法失败: ${response.error.message || "unknown error"}`);
            } else if (response.id === 1) {
                allCookies = response.result && response.result.cookies ? response.result.cookies : [];
            } else if (response.id === 2) {
                urlCookies = response.result && response.result.cookies ? response.result.cookies : [];
            } else if (response.id === 3) {
                authStatus = response.result && response.result.result ? response.result.result.value : undefined;
            }
            if (pending.size > 0) {
                return;
            }
            clearTimeout(timeoutId);
            ws.close();
            const preferredCookies = urlCookies.some((cookie) => cookie.name === LoginCookieName)
                ? mergeCookies(allCookies, urlCookies)
                : mergeCookies(urlCookies, allCookies);
            resolve({ cookies: preferredCookies, authStatus });
        });
        ws.on("error", (error) => {
            clearTimeout(timeoutId);
            reject(error);
        });
    });
}

function mergeCookies(...cookieGroups: CdpCookie[][]): CdpCookie[] {
    const cookieMap = new Map<string, CdpCookie>();
    cookieGroups
        .reduce((all, group) => all.concat(group), [])
        .forEach((cookie) => cookieMap.set(`${cookie.domain || ""}|${cookie.path || ""}|${cookie.name}`, cookie));
    return Array.from(cookieMap.values());
}

function getJson<T>(url: string): Promise<T> {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let body = "";
            res.on("data", (chunk) => body += chunk);
            res.on("end", () => {
                try {
                    resolve(JSON.parse(body));
                } catch (error) {
                    reject(error);
                }
            });
        }).on("error", reject);
    });
}

function getFreePort(): Promise<number> {
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        server.listen(0, "127.0.0.1", () => {
            const address = server.address();
            server.close(() => {
                if (address && typeof address === "object") {
                    resolve(address.port);
                } else {
                    reject(new Error("Unable to allocate a local port"));
                }
            });
        });
        server.on("error", reject);
    });
}

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function removeDirectory(dir: string) {
    if (!fs.existsSync(dir)) {
        return;
    }
    const anyFs: any = fs;
    if (anyFs.rmSync) {
        anyFs.rmSync(dir, { recursive: true, force: true });
        return;
    }
    anyFs.rmdirSync(dir, { recursive: true });
}
