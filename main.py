#!/usr/bin/python3.5

from pathlib import Path
import time
from telethon import TelegramClient, events
import random
import json

CONFIG_FILE = Path("config.json")
rickers_file = Path("rickers.json")
whitelist_file = Path("whitelist.json")

# load the config
config = json.loads(CONFIG_FILE.read_text(encoding="utf-8"))

client = TelegramClient("printer", config["apiId"], config["apiHash"], proxy=None).start()

rick_roll = Path("rick_roll.txt").read_text().split("\n")

# load the list of the rickers
if rickers_file.exists():
	rickers = json.loads(rickers_file.read_text(encoding="utf-8"))
else:
	rickers = {}

# load the whitelist
if whitelist_file.exist():
	whitelist = json.loads(whitelist_file.read_text(encoding="utf-8"))
else:
	whitelist = []

@client.on(events.NewMessage)
async def handle_new_message(event):
	user_id = str(event.from_id.user_id)

	if user_id in rickers:
		if  rickers[user_id] == len(rick_roll):
			rickers[user_id] = 0

		print (f"user_id = {event.from_id.user_id}")

		message = rick_roll[rickers[user_id]]

		rickers[user_id] += 1

		time.sleep(random.randrange(5, 30))
		await event.respond(message)

# lists all the chats with the user-ids
async def get_chats():
	chats = {}

	async for dialog in client.iter_dialogs():
		chats[dialog.name] = dialog.id

	return chats

# get the username to a specific chat name
async def get_user_id(_name):
	chats = await get_chats()

	return chats[_name]

client.start()

try:
	client.run_until_disconnected()
finally:
	print ("stopping")

	# write the state of the different rick rolls
	rickers_file.write_text(json.dumps(rickers))