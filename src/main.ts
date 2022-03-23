import fs from "fs";
import { TelegramClient } from "telegram";
import { NewMessage, NewMessageEvent } from "telegram/events";
import { StringSession } from "telegram/sessions";

const CONFIG_PATH = "config/config.json";
const WHITELIST_PATH = "config/whitelist.json";
const RICKERS_PATH = "config/rickers.json";
const RICK_ROLL_FILE = "rick_roll.txt";

let config: {
	"apiId": number,
	"apiHash": string,
	"randomSleepTime": {
		"min": number,
		"max": number,
	}
	"session": string | undefined
};
let rickers: Record<string, number> = {};
let whitelist: string[] = [];

// load the config files
if (fs.existsSync(CONFIG_PATH)) {
	config = JSON.parse(fs.readFileSync(CONFIG_PATH, { encoding: "utf-8" }));
} else {
	throw new Error("no config.json detected");
}
if (fs.existsSync(RICKERS_PATH)) {
	rickers = JSON.parse(fs.readFileSync(RICKERS_PATH, { encoding: "utf-8" }));
}
if (fs.existsSync(WHITELIST_PATH)) {
	whitelist = JSON.parse(fs.readFileSync(WHITELIST_PATH, { encoding: "utf-8" }));
}

// load the rick-roll
const rick_roll = fs.readFileSync(RICK_ROLL_FILE, { encoding: "utf-8" }).split(/\r?\n/);

// create a new telegram instance
if (config.session === undefined) {
	config.session = "";
}

const stringSession = new StringSession(config.session);

const client = new TelegramClient(stringSession, config.apiId, config.apiHash, { connectionRetries: 5, autoReconnect: true });

(async () => {
	await client.start({
		phoneNumber: "YOUR_PHONE_NUMBER",
		password: async () => "YOUR_PASSWORD",
		phoneCode: async () =>
		await input.text("Please enter the code you received: "),
		onError: (err) => {
			console.error(err);
		}
	});

	// save the session
	config.session = client.session.save() as unknown as string;
	
	// save the config file
	fs.writeFile(CONFIG_PATH, JSON.stringify(config, undefined, '\t'), (err) => {
		if (err) {
			console.error(err);
			
			throw err;
		}
	});

	client.addEventHandler(async (event: NewMessageEvent) => {
		const message = event.message;

		const sender = await message.getSender();

		if (sender) {
			if (!whitelist.includes(sender.id.toString())) {
				if (!Object.keys(rickers).includes(sender.id.toString())) {
					rickers[sender.id.toString()] = 0;
				}

				// wait a random time
				const random_sleep_time = Math.round(Math.random() * (config.randomSleepTime.max - config.randomSleepTime.min) + config.randomSleepTime.min) * 1000;
	
				setTimeout(() => {
					// send the message
					client.sendMessage(sender, { message: rick_roll[rickers[sender.id.toString()]] });
					
					// increase the rick-index
					rickers[sender.id.toString()]++;

					// check for overflow
					if (rickers[sender.id.toString()] === rick_roll.length) {
						rickers[sender.id.toString()] = 0;
					}

					// save the rickers
					fs.writeFile(RICKERS_PATH, JSON.stringify(rickers, undefined, '\t'), (err) => {
						if (err) {
							console.error(err);

							throw err;
						}
					});
				}, random_sleep_time);
			}

		}

	}, new NewMessage({}));
})();