// My code might be spaghetti, but at least it's tasty spaghetti.

require('dotenv').config();
const sendbird = require('sendbird');
const os = require('os');
const fs = require('fs');
const axios = require('axios');
const version = "version 1.0";
const moderators = ["ChatPlaceBot", "aWildGeodudeAppeared", "OptimusFries", "Rrek_YT", "Activision-Leaker", "immadingleberry"]; // People the bot trusts
const lrcst = require("lyricist")
const FormData = require("form-data");
const madAtAllTagging = ["D:<", "Can you not", "omg.", "BRO", "):<", "aaah why the notif", "*angery*"]; // Responses to @all's, just for fun.
const {
	CookieJar
} = require("tough-cookie");
const got = require("got");

let credentials = {
	userid: process.env.REDDIT_ID,
	username: process.env.REDDIT_USER,
	passwd: process.env.REDDIT_PASS,
}
let sb = new sendbird({
	appId: "2515BDA8-9D3A-47CF-9325-330BC37ADA13"
});
const form = new FormData();
form.append("user", credentials.username);
form.append("passwd", credentials.passwd);
form.append("api_type", "json");

console.log("Connecting to sendbird...");
got.post({
	body: form,
	url: "https://ssl.reddit.com/api/login",
}).then(res => {
	const cookieJar = new CookieJar();
	cookieJar.setCookieSync("reddit_session=" + encodeURIComponent(JSON.parse(res.body).json.data.cookie), "https://s.reddit.com");
	got({
		cookieJar,
		method: "get",
		url: "https://s.reddit.com/api/v1/sendbird/me",
	}).then(sbRes => {
		const sbInfo = JSON.parse(sbRes.body);
		sb.connect(credentials.userid, sbInfo.sb_access_token).then(userInfo => {
			console.log("Successfully connected to sendbird with u/" + userInfo.nickname + "!");
		}).catch(err => {
			console.error("Error while trying to connect to sendbird. Error: " + err);
		});
	}).catch(err => {
		console.error("Error while trying to get access token. Error: " + err);
	});
}).catch(err => {
	console.error("Error while trying to get session token. Error: " + err);
});
lrcst._request = async function(path) {
	// changed so the URL is made URL-y
	const url = new URL("https://api.genius.com/" + path);
	const headers = {
		Authorization: `Bearer ${this.accessToken}`,
	};
	const body = await fetch(url.toString(), {
		headers
	});
	const result = await body.json();
	if (result.error)
		throw new Error(`${result.error}: ${result.error_description}`);
	if (result.meta.status !== 200)
		throw new Error(`${result.meta.status}: ${result.meta.message}`);
	return result.response;
}
const lyricist = new lrcst(process.env.GENIUS_TOKEN);



let donators = JSON.parse(fs.readFileSync("donators.json"));

// Credit to https://github.com/joshbuchea/yo-mama for the yo mama jokes.
let allYoMamaJokes = JSON.parse(fs.readFileSync("joe-mama.json"));

let quotes = JSON.parse(fs.readFileSync("quotes.json"));
let rules = JSON.parse(fs.readFileSync("rules.json"));
let miscCommands = JSON.parse(fs.readFileSync("MiscCommands.json"));
let helpMessage = fs.readFileSync("help.txt", encoding = "utf8").split("SPLIT-INTO-MULTIPLE-MESSAGES-HERE");
let stats = JSON.parse(fs.readFileSync("stats.json"));
let chatroomStats = JSON.parse(fs.readFileSync("chatroomStats.json"))

let newsMessageMessage = "TOP NEWS MESSAGE OF THE DAY: " + os.EOL + "Post Title: %(NEWSMESSAGETITLE)" + os.EOL + "Post Content: %(NEWSMESSAGELINK)" + os.EOL + "Link To Post: %(NEWSMESSAGELINKTOPOST)";

let ch = new sb.ChannelHandler();

let newsMessage = async (count, channelUrl, channel) => {
	if (isUndefined(channelUrl)) {
		let channelListQuery = sb.GroupChannel.createMyGroupChannelListQuery();
		channelListQuery.includeEmpty = false;
		channelListQuery.limit = 100;

		if (channelListQuery.hasNext) {
			channelListQuery.next(function(channelList, error) {
				if (error) {
					console.error(error);
					return;
				}
				axios.get("http://www.reddit.com/r/news/top.json?limit=" + count.toString()).then((newsPostJson) => {
					let newsPost = newsPostJson.data.data.children[Math.floor(Math.random() * newsPostJson.data.data.children.length)].data;
					newMessage = makerandomthing(7) + newMessage;
					let newMessage = newsMessageMessage.replace("%(NEWSMESSAGETITLE)", newsPost.title);
					newMessage = newMessage.replace("%(NEWSMESSAGELINK)", newsPost.url);
					newMessage = newMessage.replace("%(NEWSMESSAGELINKTOPOST)", "https://reddit.com" + newsPost.permalink);
					newMessage = newMessage + makerandomthing(7);
					for (let i = 0; i < channelList.length; i++) {
						setTimeout(() => {
							channelList[i].sendUserMessage(newMessage, (message, error) => {
								if (error) {
									console.error(error);
								}
							});
						}, i * 1000);
					}
				});
			});
		}
	} else {
		axios.get("http://www.reddit.com/r/news/top.json?limit=" + count.toString()).then((newsPostJson) => {
			let newsPost = newsPostJson.data.data.children[Math.floor(Math.random() * newsPostJson.data.data.children.length)].data;
			let newMessage = newsMessageMessage.replace("%(NEWSMESSAGETITLE)", newsPost.title);
			newMessage = newMessage.replace("%(NEWSMESSAGELINK)", newsPost.url);
			newMessage = newMessage.replace("%(NEWSMESSAGELINKTOPOST)", "https://reddit.com" + newsPost.permalink);
			sendMsgWithChannel(channel, newMessage)
		});
	}
}
let currentAnswer = {};
let timeOfSendingOfLastTrivia = {};
let currentTrustfaller = {};
let triviaMessage = "TRIVIA!" + os.EOL + "Category: %(CATEGORY)" + os.EOL + "Difficulty: %(DIFFICULTY)" + os.EOL + "QUESTION: %(QUESTION)" + os.EOL + "%(ANSWERS)";
ch.onMessageReceived = async function(channel, message) {
	if (message._sender.userId != sb.currentUser.userId) {
		addToStats(message._sender.nickname, message.channelUrl, 1, channel.name);
	}
	let messageText = message.message.replace(/[^\r\n\t\x20-\x7E\xA0-\xFF]/g, " ").trim();
	if (messageText.toLowerCase().includes("@all")) {
		sendMsgWithChannel(channel, madAtAllTagging[Math.floor(Math.random() * madAtAllTagging.length)]);
	}
	if (messageText.startsWith("/")) {
		let cleanMessageText = messageText.toLowerCase().slice(1).trim();
		let args = messageText.split(" ").slice(1);
		let command = cleanMessageText.split(" ")[0];
		switch (command) {
			case "quote":
				sendMsgWithChannel(channel, `"${quotes[Math.floor(Math.random() * quotes.length)]}"`)
				break;
			case "addquote":
				if (args.length > 0) {
					quotes.push(stringFromList(args));
					sendMsgWithChannel(channel, "Quote added.");
				} else {
					sendMsgWithChannel(channel, "You have to define the quote!");
				}
				break;
			case "rules":
				sendMsgWithChannel(channel, isUndefined(rules[message.channelUrl]) ? "The moderators haven't set any rules yet in ChatPlaceBot." : `The rules for ${channel.name} are:\n${rules[message.channelUrl]}`)
				break;
			case "setrules":
				let opQueryToTestIfSenderIsMod = channel.createOperatorListQuery();
				opQueryToTestIfSenderIsMod.limit = 100;
				opQueryToTestIfSenderIsMod.next(function(ops) {
					if (userListContainsUser(ops, message._sender)) {
						rules[message.channelUrl] = stringFromList(args);
						sendMsgWithChannel(channel, "Successfully set rules!");
					} else {
						sendMsgWithChannel(channel, "You aren't a moderator!");
					}
				});
				break;
			case "wyr":
				sendMsgWithChannel(channel, await wouldYouRather());
				break;
			case "pfp":
				if (!isUndefined(args[0])) {
					if (args[0].toLowerCase().startsWith("@")) {
						args[0] = args[0].slice(1);
					} else if (args[0].toLowerCase().startsWith("u/")) {
						args[0] = args[0].slice(2);
					}
					var userToGet = args[0];
					axios.get(`https://www.reddit.com/user/${userToGet}/about.json`).then((result) => {
						sendMsgWithChannel(channel, isUndefined(result.data.error) ? `${userToGet}'s profile picture looks like this: \n${result.data.data.icon_img.split("?")[0]}` : `This isn't a real person!`);
					});
				} else {
					sendMsgWithChannel(channel, "You have to define whose pfp to get!")
				}
				break;
			case "chatroomcount":
				let channelListQuery = sb.GroupChannel.createMyGroupChannelListQuery();
				channelListQuery.includeEmpty = false;
				channelListQuery.limit = 100;
				if (channelListQuery.hasNext) {
					channelListQuery.next(function(channelList, error) {
						if (error) {
							console.warn(error);
						}
						sendMsgWithChannel(channel, `I am in ${channelList.length} chats!`);
					});
				}
				break;
			case "chatroomstats":
			case "topchats":
			case "topchatrooms":
				sendMsgWithChannel(channel, `Top 10 chatrooms:` + getTopInChatroomStats(10));
				break;
			case "bigchatroomstats":
			case "bigtopchats":
			case "bigtopchatrooms":
				if (args.length == 0) {
					sendMsgWithChannel(channel, "No amount defined, assuming 10.");
					args[0] = 10;
				}
				if (!isNaN(parseInt(parseFloat(args[0])))) {
					sendMsgWithChannel(channel, `Top ${parseInt(parseFloat(args[0]))} chatrooms:` + getTopInChatroomStats(parseInt(parseFloat(args[0]))));
				} else {
					sendMsgWithChannel(channel, `"${args[0]}" isn't a valid number!`);
				}
				break;
			case "rick":
				const params = new sb.FileMessageParams();
				params.fileUrl = new URL("https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg").toString();
				channel.deleteMessage(message, function(response, error) {
					if (error) {
						console.warn(error);
						return;
					}
					channel.sendFileMessage(params, function(fileMessage, error) {
						if (error) {
							console.warn(error);
							return;
						}
					});
				});
				break;
			case "moderators":
			case "mods":
				let operatorListQuery = channel.createOperatorListQuery();
				operatorListQuery.limit = 100;
				let msg = "The moderators of " + channel.name + " are: ";
				operatorListQuery.next(function(mods) {
					for (let mod of mods) {
						if (mod.userId == sb.currentUser.userId) {
							msg = msg + "\n- ChatPlaceBot (This means that moderator commands are possible)";
						} else {
							msg = msg + "\n- " + mod.nickname;
						}
					}
					sendMsgWithChannel(channel, msg);
				});
				break;
			case "bigstats":
				if (args.length > 0) {
					if (!isNaN(parseInt(parseFloat(args[0])))) {
						sendMsgWithChannel(channel, `Top ${args[0]} chatters in ${channel.name}:${getTopInStats(message.channelUrl,parseInt(parseFloat(args[0])))}`);
					} else {
						sendMsgWithChannel(channel, `"${args[0]}" isn't a valid number!`);
					}
				} else {
					sendMsgWithChannel(channel, `You need to say how many people to get!`);
				}
				break;
			case "emergencyruncode":
				if (message._sender.userId == "t2_1asu2r2u") { //if it's aWildGeodudeAppeared
					(new Function(["sb", "channel", "sendMsgWithChannel", "message"], stringFromList(args)))(sb, channel, sendMsgWithChannel, message)
				}
				break;
			case "urban":
				axios({
						"method": "GET",
						"url": "https://mashape-community-urban-dictionary.p.rapidapi.com/define",
						"headers": {
							"content-type": "application/octet-stream",
							"x-rapidapi-host": "mashape-community-urban-dictionary.p.rapidapi.com",
							"x-rapidapi-key": process.env.URBAN_KEY
						},
						"params": {
							"term": stringFromList(args)
						}
					})
					.then((response) => {
						if (isUndefined(response.data.list[0])) {
							sendMsgWithChannel(channel, `Sorry, but ${stringFromList(args)} doesn't seem to have a definition.`);
						} else {
							sendMsgWithChannel(channel, `In the urban dictionary, ${stringFromList(args)} means: \n\n${response.data.list[0].definition}`);
						}
					}).catch((error) => {
						console.warn(error);
					});
				break;
			case "liststats":
			case "getstats":
			case "stats":
				sendMsgWithChannel(channel, `Top 10 chatters in ${channel.name}:${getTopInStats(message.channelUrl,10)}`);
				break;
			case "ban":
			case "gulag":
				try {
					let operatorListQuery = channel.createOperatorListQuery();
					operatorListQuery.next(function(ops) {
						if (userListContainsUser(ops, message._sender)) {
							if (userListContainsUser(ops, sb.currentUser)) {
								if (args.length < 3) {
									let problem = ""
									switch (args.length) {
										case 0:
											problem = "\nYour problem was that you didn't define anything.";
											break;
										case 1:
											problem = "\nYour problem was that you didn't define the length and the unit. The unit can be either SECONDS, MINUTES, HOURS, DAYS, MONTHS or YEARS, depending on how long you want to ban someone.";
											break;
										case 2:
											problem = "\nYour problem was that you didn't define the unit. This can be either SECONDS, MINUTES, HOURS, DAYS, MONTHS or YEARS, depending on how long you want to ban someone.";
											break;
									}
									sendMsgWithChannel(channel, "The Command Syntax Is Wrong. Correct Syntax: \n/gulag [Person to send to the Gulag] [Length] [Possible Units: YEARS/Y | MONTHS/M | DAYS/D | HOURS/H | MINUTES/MIN | SECONDS/S]" + problem);
								} else {
									let reasonForBan = "No reason defined.";
									if (args.length > 3) {
										reasonForBan = stringFromList(args.slice(3));
									}
									if (args[0].toLowerCase().startsWith("@")) {
										args[0] = args[0].slice(1);
									} else if (args[0].toLowerCase().startsWith("u/")) {
										args[0] = args[0].slice(2);
									}
									let participantList = channel.members;
									let userToBan = null;
									for (var person of participantList) {
										if (person.nickname.toLowerCase() == args[0].toLowerCase()) {
											userToBan = person.userId;
										}
									}
									let multiplier = 1;
									switch (args[2].toUpperCase()) {
										case "Y":
										case "YEAR":
										case "YEARS":
											args[2] = " years";
											multiplier = 31536000; // 1 year = 31536000 seconds.
											break;
										case "M":
										case "MONTH":
										case "MONTHS":
											args[2] = " months";
											multiplier = 86400; // 1 day = 86400 seconds.
											break;
										case "D":
										case "DAY":
										case "DAYS":
											args[2] = " days";
											multiplier = 86400; // 1 day = 86400 seconds.
											break;
										case "H":
										case "HOUR":
										case "HOURS":
											args[2] = " hours";
											multiplier = 3600; // 1 hour = 3600 seconds
											break;
										case "MIN":
										case "MINUTE":
										case "MINUTES":
											args[2] = " minutes";
											multiplier = 60; // 1 minute = 60 seconds
											break;
										case "S":
										case "SECOND":
										case "SECONDS":
											args[2] = " seconds";
											multiplier = 1; // surprisingly enough, a second is one second.
											break;
										default:
											sendMsgWithChannel(channel, "I don't know this unit. \nThe possible units are: SECONDS (S for short), MINUTES (MIN for short), HOURS (H for short), DAYS (D for short), MONTHS (M for short) or YEARS (Y for short)");
											return;
									}
									if (userToBan != null) {
										if (!isNaN(parseFloat(args[1]))) {
											channel.banUserWithUserId(userToBan, parseInt(parseFloat(args[1]) * multiplier), reasonForBan, function(response, error) {
												if (error) {
													console.warn(error);
													sendMsgWithChannel(channel, "Oh gosh. An error occured. Please notify u/aWildGeodudeAppeared of this");
													return;
												}
												sendMsgWithChannel(channel, args[0] + " has been sent to the gulag for " + parseFloat(args[1]) + args[2] + ".");
											});
										} else {
											sendMsgWithChannel(channel, "'" + args[1] + "' isn't a valid number.");
										}
									} else {
										sendMsgWithChannel(channel, "This user could not be found.");
									}
								}
							} else {
								sendMsgWithChannel(channel, "I don't have permissions to do this.");
							}
						} else {
							sendMsgWithChannel(channel, "You don't have permissions to do this.");
						}
					});
				} catch (e) {
					console.warn(e);
					sendMsgWithChannel(channel, "Oh gosh. An error occured. Please notify u/aWildGeodudeAppeared of this");
				}
				break;
			case "news":
				newsMessage(20, message.channelUrl, channel);
				break;
			case "trivia":
				trivia(message.channelUrl, channel);
				break;
			case "tanswer":
				tanswer(message.channelUrl, channel);
				break;
			case "yomama":
				sendMsgWithChannel(channel, allYoMamaJokes[Math.floor(Math.random() * allYoMamaJokes.length)]);
				break;
			case "botinfo":
				sendMsgWithChannel(channel, "A bot made by u/aWildGeodudeAppeared, for r/TheChatPlace." + os.EOL + os.EOL + version + os.EOL + os.EOL +
					" Donate at https://www.reddit.com/fkltc4 " + os.EOL + "Make sure to include your u/ in the donation, so you get premium perks. These include: " + os.EOL +
					"The /setdescription command!");
				break;
			case "commands":
			case "help":
				for (var helpMessagePart of helpMessage) {
					sendMsgWithChannel(channel, helpMessagePart);
				}
				break;
			case "titleset":
			case "settitle":
				if (!moderators.includes(message._sender.nickname)) {
					sendMsgWithChannel(channel, "Hey! You're not allowed to run this command!");
					console.log(message._sender.nickname + " isnt in " + JSON.stringify(moderators));
				} else if (isUndefined(args[0]) || isUndefined(args[1])) {
					sendMsgWithChannel(channel, "Not Enough Arguments!");
				} else {
					if (args[0].toLowerCase().startsWith("@")) {
						args[0] = args[0].slice(1);
					} else if (args[0].toLowerCase().startsWith("u/")) {
						args[0] = args[0].slice(2);
					}
					let newTitle = stringFromList(messageText.split(" ").slice(2)).trim();
					setTitle(args[0].toLowerCase(), newTitle.trim());
					sendMsgWithChannel(channel, args[0] + "'s title has been succesfully set to: " + newTitle);
				}
				break;
			case "titleget":
			case "gettitle":
				if (isUndefined(args[0])) {
					sendMsgWithChannel(channel, "Not Enough Arguments! You need to specify who's title to get!");
				} else {
					if (args[0].toLowerCase().startsWith("@")) {
						args[0] = args[0].slice(1);
					} else if (args[0].toLowerCase().startsWith("u/")) {
						args[0] = args[0].slice(2);
					}
					getTitle(args[0].toLowerCase(), (title) => {
						sendMsgWithChannel(channel, args[0] + "'s title is: " + os.EOL + title);
					});
				}
				break;
			case "getlyrics":
				if (isUndefined(args[0])) {
					sendMsgWithChannel(channel, "Not Enough Arguments! You have to give the song title!");
				} else {
					lyricist.search(require('querystring').escape(stringFromList(args)))
						.then(async (result) => {
							if (!isUndefined(result[0])) {
								const song = await lyricist.song(result[0].id.toString(), {
									fetchLyrics: true
								});
								channel.sendUserMessage((`Lyrics of: ${song.full_title}\n\n${song.lyrics}`).replace("@all", "@ all"), (message, error) => {
									if (error) {
										console.warn(`An error occured while trying to send the song lyrics of ${song.full_title} in the channel ${channel.name}`);
										console.warn(error.name + ": " + error.message);
									}
								});
							} else {
								sendMsgWithChannel(channel, "Sorry, " + message._sender.nickname + ", but this song doesn't exist.")
							}
						});
				}
				break;
			case "descriptionset":
			case "setdescription":
				if (!donators.includes(message._sender.nickname.toLowerCase())) {
					sendMsgWithChannel(channel, "Hey! You're not a donator!");
				} else if (isUndefined(args[0])) {
					sendMsgWithChannel(channel, "You need to specify a description, silly!");
				} else {
					let newDescription = stringFromList(messageText.split(" ").slice(1)).trim();
					setDescription(message._sender.nickname.toLowerCase(), newDescription.trim());
					sendMsgWithChannel(channel, "Your description has been succesfully set to: " + os.EOL + newDescription);
				}
				break;
			case "descriptionget":
			case "getdescription":
				if (isUndefined(args[0])) {
					sendMsgWithChannel(channel, "Not Enough Arguments! You need to specify who's description to get!");
				} else {
					if (args[0].toLowerCase().startsWith("@")) {
						args[0] = args[0].slice(1);
					} else if (args[0].toLowerCase().startsWith("u/")) {
						args[0] = args[0].slice(2);
					}
					getDescription(args[0].toLowerCase(), (description, success) => {
						if (success) {
							sendMsgWithChannel(channel, args[0] + "'s description is: " + os.EOL + description);
						} else {
							sendMsgWithChannel(channel, description);
						}
					});
				}
				break;
			case "gamemode":
				if (isUndefined(args[0])) {
					sendMsgWithChannel(channel, "You have to at least define the gamemode!");
					return;
				}
				let nicknameToSetTo = message._sender.nickname;
				if (!isUndefined(args[1])) {
					nicknameToSetTo = args[1];
				}
				let gamemode = "ERROR";
				switch (args[0]) {
					case "0":
						gamemode = "survival";
						break;
					case "1":
						gamemode = "creative";
						break;
					case "2":
						gamemode = "adventure";
						break;
					case "3":
						gamemode = "spectator";
						break;
					default:
						gamemode = args[0];
						break;
				}
				sendMsgWithChannel(channel, nicknameToSetTo + "'s gamemode has been changed to: " + gamemode);
				break;
			case "trustfall":
				sendMsgWithChannel(channel, message._sender.nickname.toUpperCase() + " TRUSTFALLS! SOMEONE CATCH THEM!");
				currentTrustfaller[message.channelUrl] = {
					name: message._sender.nickname,
					catched: false,
					hasBeen10Secs: false
				};
				setTimeout(() => {
					if (!currentTrustfaller[message.channelUrl].catched) {
						sendMsgWithChannel(channel, message._sender.nickname.toUpperCase() + " DIDN'T GET CATCHED! Y'all are bad friends");
					}
					currentTrustfaller[message.channelUrl].hasBeen10Secs = true;
				}, 10000);
				break;
			case "catch":
				if (isUndefined(currentTrustfaller[message.channelUrl])) {
					sendMsgWithChannel(channel, message._sender.nickname + " catched abolutely nobody.");
					break;
				}
				if (currentTrustfaller[message.channelUrl].hasBeen10Secs || currentTrustfaller[message.channelUrl].catched) {
					sendMsgWithChannel(channel, message._sender.nickname + " catched abolutely nobody.");
					break;
				}
				if (currentTrustfaller[message.channelUrl].name == message._sender.nickname) {
					sendMsgWithChannel(channel, message._sender.nickname + ", you can't catch yourself!");
					break;
				}
				sendMsgWithChannel(channel, message._sender.nickname.toUpperCase() + " CATCHED " + currentTrustfaller[message.channelUrl].name.toUpperCase() + "! Thank god!");
				currentTrustfaller[message.channelUrl].catched = true;
				break;
			case "dissect":
				if (isUndefined(args[0])) {
					sendMsgWithChannel(channel, "You have to specify a command to dissect!")
				} else {
					if (args[0].startsWith("/")) {
						args[0] = args[0].slice(1);
					}
					if (!isUndefined(miscCommands[args[0]])) {
						sendMsgWithChannel(channel, args[0] + " works like this: " + os.EOL + "\"" + miscCommands[args[0].toLowerCase()] + "\"");
					} else {
						sendMsgWithChannel(channel, "This command doesn't seem to have a definition. Keep in mind that spicy commands do not work with the dissect command.");
					}
				}
				break;
			case "rng":
				if (Math.random() < 0.001) {
					// An easter egg I added because, well, why not?
					sendMsgWithChannel(channel, "Your dice never landed.");
					var eamsg = `SOMEONE FOUND THE EASTER EGG! IT WAS ${message._sender.nickname} IN ${channel.name}!`;
					for (var i = 0; i < 10; i++) {
						console.log(eamsg);
					}
				} else {
					sendMsgWithChannel(channel, (!isNaN(parseFloat(args[0])) && !isNaN(parseFloat(args[1]))) ? `Your dice landed on a ${Math.floor((Math.random() * ((parseFloat(args[1])+1)-parseFloat(args[0])))+parseFloat(args[0]))}!` : "These aren't valid numbers!");
				}
				break;
			default:
				if (!isUndefined(miscCommands[command.toLowerCase()])) {
					let returning = miscCommands[command.toLowerCase()][Math.floor(Math.random() * miscCommands[command.toLowerCase()].length)];
					let allArgsList = messageText.split(" ").slice(1);
					let allArgsString = stringFromList(allArgsList);
					let allArgsFromOneString = stringFromList(allArgsList.slice(1));
					let allArgsFromTwoString = stringFromList(allArgsList.slice(2));
					returning = returning.replace("%(SENDER)", message._sender.nickname);
					returning = returning.replace("%(ARG1)", args[0]);
					returning = returning.replace("%(ARG2)", args[1]);
					returning = returning.replace("%(ARG3)", args[2]);
					returning = returning.replace("%(ALLARGS)", allArgsString);
					returning = returning.replace("%(ALLARGSAFTER1)", allArgsFromOneString);
					returning = returning.replace("%(ALLARGSAFTER1)", allArgsFromTwoString);
					returning = returning.replace("%(SENDER)", message._sender.nickname);
					sendMsgWithChannel(channel, returning)
				}
				break;
		}
	}
}

function wouldYouRather() {
	return axios.get(`https://www.rrrather.com/botapi`).then((result) => {
		if (result.data.nsfw) {
			return wouldYouRather();
		} else {
			return `${result.data.title}\nA: ${result.data.choicea}\nor..\nB: ${result.data.choiceb}`;
		}
	});
}

function userListContainsUser(userList, user) {
	for (let userToCheck of userList) {
		if (userToCheck.userId == user.userId) {
			return true;
		}
	}
	return false;
}

function stringFromList(list) {
	let returning = "";
	for (let i = 0; i < list.length; i++) {
		returning += list[i] + " ";
	}
	return returning;
}

function isUndefined(thing) {
	return typeof(thing) == "undefined";
}

async function getDescription(nick, callback) {
	fs.readFile("descriptions.json", (err, data) => {
		let descriptions = JSON.parse(data);
		if (isUndefined(descriptions[nick])) {
			callback("This person doesn't have a description.", false)
			return;
		}
		callback(descriptions[nick], true)
	});
}

async function setDescription(nick, newDescription) {
	fs.readFile("descriptions.json", (err, data) => {
		let descriptions = JSON.parse(data);
		descriptions[nick] = newDescription;
		fs.writeFile("descriptions.json", JSON.stringify(descriptions), (err) => {
			if (err) {
				console.warn(err);
			}
		});
	});
}

async function getTitle(nick, callback) {
	fs.readFile("titles.json", (err, data) => {
		let currentTitles = JSON.parse(data);
		if (isUndefined(currentTitles[nick])) {
			callback("This person doesn't have a title.")
			return;
		}
		callback(currentTitles[nick].t)
	});
}

async function setTitle(nick, newTitle) {
	fs.readFile("titles.json", (err, data) => {
		let currentTitles = JSON.parse(data);
		if (isUndefined(currentTitles[nick])) {
			currentTitles[nick] = {
				t: newTitle
			}
		} else {
			currentTitles[nick].t = newTitle;
		}
		fs.writeFile("titles.json", JSON.stringify(currentTitles), (err) => {
			if (err) {
				console.warn(err);
			}
		});
	});
}

function sendMsgWithChannel(channel, msg) {
	channel.sendUserMessage(msg.replace("@all", "@ all"), (message, error) => {
		if (error) {
			if (error.code != 900060) {
				console.warn(`An error occured while trying to send "${msg}" in the channel ${channel.name}`);
				console.warn(error);
			}
		}
	});
}

function trivia(channelUrl, channel) {
	if (timeOfSendingOfLastTrivia[channelUrl] + 20000 < Date.now() || isUndefined(timeOfSendingOfLastTrivia[channelUrl])) {
		axios.get("http://opentdb.com/api.php?amount=1").then((requestJson) => {
			let result = requestJson.data.results[0];
			result.question = unescapeHTML(result.question);
			let newMessage = triviaMessage.replace("%(CATEGORY)", result.category);
			newMessage = newMessage.replace("%(DIFFICULTY)", result.difficulty);
			if (result.type == "boolean") {
				newMessage = newMessage.replace("%(QUESTION)", "Yes Or No: " + result.question);
				newMessage = newMessage.replace("%(ANSWERS)", "");
			} else {
				newMessage = newMessage.replace("%(QUESTION)", result.question);
				let answers = [];
				answers.push(result.correct_answer);
				for (let o of result.incorrect_answers) {
					answers.push(o);
				}
				for (let i = answers.length - 1; i > 0; i--) {
					let j = Math.floor(Math.random() * (i + 1));
					[answers[i], answers[j]] = [answers[j], answers[i]];
				}
				let answersString = "";
				for (let i = 0; i < answers.length; i++) {
					if (i != 0) {
						answersString += ", ";
					}
					answersString += answers[i];
				}
				answersString = unescapeHTML(answersString);
				newMessage = newMessage.replace("%(ANSWERS)", "ANSWERS: " + answersString);
				timeOfSendingOfLastTrivia[channelUrl] = Date.now();
				firstTrivia = false;
				sendMsgWithChannel(channel, newMessage);
				currentAnswer = result.correct_answer;
			}
		});
	} else {
		sendMsgWithChannel(channel, "People are requesting trivia's way too fast! Please wait another " + (60 + Math.round((timeOfSendingOfLastTrivia[channelUrl] - Date.now()) / 1000)).toString() + " seconds.");
	}
}

function tanswer(channelUrl, channel) {
	if (isUndefined(timeOfSendingOfLastTrivia[channelUrl])) {
		sendMsgWithChannel(channel, "No Answer Yet ):");
		return;
	}
	if (timeOfSendingOfLastTrivia[channelUrl] + 15000 < Date.now()) {
		sb.GroupChannel.getChannel(channelUrl, function(groupChannel, error) {
			if (error) {
				return;
			}
			groupChannel.sendUserMessage("THE ANSWER IS: " + currentAnswer, (message, error) => {
				if (error) {
					console.error(error);
				}
			});
		});
	} else {
		channel.sendUserMessage("Not yet! Please wait another " + (30 + Math.round((timeOfSendingOfLastTrivia[channelUrl] - Date.now()) / 1000)).toString() + " seconds.", (message, error) => {
			if (error) {
				console.error(error);
			}
		});
	}
}

function unescapeHTML(str) {
	let htmlEntities = {
		nbsp: ' ',
		cent: '¢',
		pound: '£',
		yen: '¥',
		euro: '€',
		copy: '©',
		reg: '®',
		lt: '<',
		gt: '>',
		quot: '"',
		amp: '&',
		apos: '\'',
		prime: "\'",
		Prime: "\""
	};
	return str.replace(/\&([^;]+);/g, function(entity, entityCode) {
		let match;

		if (entityCode in htmlEntities) {
			return htmlEntities[entityCode];
		} else if (match = entityCode.match(/^#x([\da-fA-F]+)$/)) {
			return String.fromCharCode(parseInt(match[1], 16));
		} else if (match = entityCode.match(/^#(\d+)$/)) {
			return String.fromCharCode(~~match[1]);
		} else {
			return entity;
		}
	});
}

function addToStats(username, channelUrl, amountToAdd, channelName) {
	if (isUndefined(chatroomStats[channelUrl])) {
		chatroomStats[channelUrl] = {
			name: channelName,
			amount: 0
		};
	}
	if (isUndefined(stats[channelUrl])) {
		stats[channelUrl] = {};
	}
	if (isUndefined(stats[channelUrl][username])) {
		stats[channelUrl][username] = 0;
	}
	chatroomStats[channelUrl].amount += amountToAdd;
	chatroomStats[channelUrl].name = channelName;
	return stats[channelUrl][username] += amountToAdd;
}

function makerandomthing(length) {
	let result = '';
	let characters = '~-+=';
	let charactersLength = characters.length;
	for (let i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
}

function getTopInStats(channelUrl, amountToGet) {
	if (isUndefined(stats[channelUrl])) {
		return "Nobody's chatted in this chat yet.";
	}
	let sortedStats = sort(stats[channelUrl]).reverse().slice(0, amountToGet);
	let endString = "";
	for (let person of sortedStats) {
		endString = endString + `\n- ${person.name} with ${person.val} messages!`;
	}
	return endString;
}

function getTopInChatroomStats(amountToGet) {
	let arr = [];
	for (let url in chatroomStats) {
		arr.push(chatroomStats[url]);
	}
	let len = arr.length;
	for (let i = len - 1; i >= 0; i--) {
		for (let j = 1; j <= i; j++) {
			if (arr[j - 1].amount > arr[j].amount) {
				let temp = arr[j - 1];
				arr[j - 1] = arr[j];
				arr[j] = temp;
			}
		}
	}
	arr = arr.reverse().slice(0, amountToGet)
	let endString = "";
	for (let chatroom of arr) {
		endString = endString + `\n- "${chatroom.name}" with ${chatroom.amount} messages!`;
	}
	return endString;
}

function sort(obj) {
	let arr = [];
	for (let name in obj) {
		arr.push({
			name,
			val: obj[name]
		})
	}
	let len = arr.length;
	for (let i = len - 1; i >= 0; i--) {
		for (let j = 1; j <= i; j++) {
			if (arr[j - 1].val > arr[j].val) {
				let temp = arr[j - 1];
				arr[j - 1] = arr[j];
				arr[j] = temp;
			}
		}
	}
	return arr;
}

ch.onUserReceivedInvitation = (channel, inviter, invitees) => {
	if (userListContainsUser(invitees, sb.currentUser)) {
		console.log("I've been invited to a channel! :D");
		channel.acceptInvitation(function() {
			sendMsgWithChannel(channel, "Hi! I'm ChatPlaceBot. I got invited to this chat. To get help using me, do /help.");
		});
		console.log(`I've accepted the invite to ${channel.name}!`);
	}
};
sb.addChannelHandler("vsdfh64mc93mg0cn367vne4m50bn3b238", ch);
let messageInterval = setInterval(function() {
	console.log("News messages are being sent! Also, saving the stats in case anything happens.");
	fs.writeFileSync("stats.json", JSON.stringify(stats));
	newsMessage(1);
}, 1000 * 60 * 60 * 24);

function exitHandler(exit) {
	fs.writeFileSync("stats.json", JSON.stringify(stats));
	fs.writeFileSync("chatroomStats.json", JSON.stringify(chatroomStats));
	fs.writeFileSync("rules.json", JSON.stringify(rules));
	fs.writeFileSync("quotes.json", JSON.stringify(quotes));
	if (exit) process.exit();
}

process.on('exit', exitHandler.bind(false));
process.on('SIGINT', exitHandler.bind(true));
process.on('SIGUSR1', exitHandler.bind(true));
process.on('SIGUSR2', exitHandler.bind(true));
process.on('uncaughtException', (err, origin) => {
	console.error(err);
	console.error(origin);
	exitHandler.bind(true);
});