
import { SelfProfileAPI, SignUpRedirectPage } from "../const/URL";
import { IProfile } from "../model/target/target";
import { sendRequest } from "./http.service";
import { Output } from "../global/logger";


export class AccountService {
	public profile: IProfile;

	constructor () {}

	async fetchProfile() {
		this.profile  = await sendRequest({
			uri: SelfProfileAPI,
			json: true
		});
	}

	async isAuthenticated(): Promise<boolean> {

		let checkIfSignedIn;
		try {
			checkIfSignedIn = await sendRequest({
				uri: SelfProfileAPI,
				resolveWithFullResponse: true,
				gzip: true,
				json: true,
				simple: false,
				timeout: 15000
			});
		} catch (err) {
			console.error('Http error', err);
			Output(`登录状态验证异常: ${String(err)}`);
			return false;
		}
		Output(`登录状态验证返回: ${checkIfSignedIn ? checkIfSignedIn.statusCode : 'null'}`);
		return Promise.resolve(checkIfSignedIn ? checkIfSignedIn.statusCode == 200 : false);
	}

}
