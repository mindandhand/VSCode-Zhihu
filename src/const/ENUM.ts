export enum MediaTypes {
	answer = 'answer',
	question = 'question',
	article = 'article'
}

export enum SearchTypes {
	general = 'general',
	question = 'question',
	answer = 'answer',
	article = 'article'
}

export enum Weekdays {
	Mon = 'Mon',
	Tue = 'Tue',
	Wed = 'Wed',
	Tur = 'Tur',
	Fri = 'Fri',
	Sat = 'Sat',
	Sun = 'Sun'
}

export const WeekdaysDict = {
	Mon: 1,
	Tue: 2,
	Wed: 3,
	Tur: 4,
	Fri: 5,
	Sat: 6,
	Sun: 7
}

export const LegalImageExt = [ '.jpg', '.jpeg', '.gif', '.png' ]; 

export enum LoginEnum {
	sms,
	password,
	qrcode,
	weixin
}

export const LoginTypes = [
	{ value: LoginEnum.qrcode, ch: '浏览器 Cookie', description: '推荐：在打开的浏览器里用账号密码登录，插件会自动获取 Cookie' },
	// { value: LoginEnum.sms, ch: '短信验证码' },
	// 内置密码/验证码登录链路容易被知乎风控拦截，保留实现但不再暴露入口。
	// { value: LoginEnum.password, ch: '账号密码' },
];

export const JianshuLoginTypes = [
	{ value: LoginEnum.weixin, ch: '微信'  }
]

export enum SettingEnum {
	useVSTheme = 'useVSTheme',
	isTitleImageFullScreen = 'isTitleImageFullScreen',
	useWaterMark = 'useWaterMark'
}

export enum WebviewEvents {
	collect = 'collect',
	share = 'share',
	open = 'open',
	upvoteAnswer = 'upvoteAnswer',
	upvoteArticle = 'upvoteArticle'
}
