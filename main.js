require('dotenv').config();
const sendbird = require('sendbird');
const os = require('os');
const fs = require('fs');
const axios = require('axios');
const version = "version 0.5";
const moderators = ["ChatPlaceBot", "aWildGeodudeAppeared", "OptimusFries", "Rrek_YT", "Activision-Leaker", "immadingleberry"];
const lrcst = require("lyricist")
const FormData = require("form-data");
const madAtAllTagging = ["D:<", "Can you not", "omg.", "BRO", "):<", "y tho", "aaah why the notif", "*angery*"];
const {
	CookieJar
} = require("tough-cookie");
const got = require("got");

let credentials = {
	userid: process.env.REDDIT_ID,
	username: process.env.REDDIT_USER,
	passwd: process.env.REDDIT_PASS,
}
var sb = new sendbird({
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
			console.log("Error while trying to connect to sendbird. Error: " + err);
		});
	}).catch(err => {
		console.log("Error while trying to get access token. Error: " + err);
	});
}).catch(err => {
	console.log("Error while trying to get session token. Error: " + err);
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
let miscCommands = JSON.parse(fs.readFileSync("MiscCommands.json"));
let helpMessage = fs.readFileSync("help.txt", encoding = "utf8");

var newsMessageMessage = "TOP NEWS MESSAGE OF THE DAY: " + os.EOL + "Post Title: %(NEWSMESSAGETITLE)" + os.EOL + "Post Content: %(NEWSMESSAGELINK)" + os.EOL + "Link To Post: %(NEWSMESSAGELINKTOPOST)";

var ch = new sb.ChannelHandler();

var newsMessage = async (count, channelUrl, channel) => {
	if (isUndefined(channelUrl)) {
		var channelListQuery = sb.GroupChannel.createMyGroupChannelListQuery();
		channelListQuery.includeEmpty = true;
		channelListQuery.limit = 100;

		if (channelListQuery.hasNext) {
			channelListQuery.next(function(channelList, error) {
				if (error) {
					console.error(error);
					return;
				}
				axios.get("http://www.reddit.com/r/news/top.json?limit=" + count.toString()).then((newsPostJson) => {
					var newsPost = newsPostJson.data.data.children[Math.floor(Math.random() * newsPostJson.data.data.children.length)].data;
					newMessage = makerandomthing(7) + newMessage;
					var newMessage = newsMessageMessage.replace("%(NEWSMESSAGETITLE)", newsPost.title);
					newMessage = newMessage.replace("%(NEWSMESSAGELINK)", newsPost.url);
					newMessage = newMessage.replace("%(NEWSMESSAGELINKTOPOST)", "https://reddit.com" + newsPost.permalink);
					newMessage = newMessage + makerandomthing(7);
					for (var i = 0; i < channelList.length; i++) {
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
			var newsPost = newsPostJson.data.data.children[Math.floor(Math.random() * newsPostJson.data.data.children.length)].data;
			var newMessage = newsMessageMessage.replace("%(NEWSMESSAGETITLE)", newsPost.title);
			newMessage = newMessage.replace("%(NEWSMESSAGELINK)", newsPost.url);
			newMessage = newMessage.replace("%(NEWSMESSAGELINKTOPOST)", "https://reddit.com" + newsPost.permalink);
			sendMsgWithChannel(channel, newMessage)
		});
	}
}
var currentAnswer = {};
var timeOfSendingOfLastTrivia = {};
var currentTrustfaller = {};
var triviaMessage = "TRIVIA!" + os.EOL + "Category: %(CATEGORY)" + os.EOL + "Difficulty: %(DIFFICULTY)" + os.EOL + "QUESTION: %(QUESTION)" + os.EOL + "%(ANSWERS)";
ch.onMessageReceived = function(channel, message) {
	var messageText = message.message;
	if (messageText.toLowerCase().includes("@all")) {
		sendMsgWithChannel(channel, madAtAllTagging[Math.floor(Math.random() * madAtAllTagging.length)]);
	}
	if (messageText.startsWith("/")) {
		var cleanMessageText = messageText.toLowerCase().slice(1).trim();
		var args = messageText.split(" ").slice(1);
		var command = cleanMessageText.split(" ")[0];
		switch (command) {
			case "moderators":
			case "mods":
				var operatorListQuery = channel.createOperatorListQuery();
				var msg = "The moderators of " + channel.name + " are: ";
				operatorListQuery.next(function(mods) {
					for (var mod of mods) {
						if (mod.userId == sb.currentUser.userId) {
							msg = msg + "\n- ChatPlaceBot (This means that moderator commands are possible)"
						} else {
							msg = msg + "\n- " + mod.nickname;
						}
					}
					sendMsgWithChannel(channel, msg);
				});
				break;
			case "ban":
			case "gulag":
				try {
					var operatorListQuery = channel.createOperatorListQuery();
					operatorListQuery.next(function(ops) {
						if (userListContainsUser(ops, message._sender)) {
							if (userListContainsUser(ops, sb.currentUser)) {
								if (args.length < 3) {
									var problem = ""
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
									var reasonForBan = "No reason defined.";
									if (args.length > 3) {
										reasonForBan = stringFromList(args.slice(3));
									}
									if (args[0].startsWith("u/")) {
										args[0] = args[0].slice(2);
									}
									var participantList = channel.members;
									var userToBan;
									for (var participant of participantList) {
										if (participant.nickname.toLowerCase() == args[0].toLowerCase()) {
											userToBan = participant.userId;
										}
									}
									var multiplier = 1;
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
									if (!isUndefined(userToBan)) {
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
					" Donate at https://streamlabs.com/danielmensyt/tip (Via Skrill) " + os.EOL + "Make sure to include your u/ in the donation, so you get premium perks. These include: " + os.EOL +
					"The /setdescription command!");
				break;
			case "commands":
			case "help":
				sendMsgWithChannel(channel, helpMessage);
				break;
			case "titleset":
			case "settitle":
				if (!moderators.includes(message._sender.nickname)) {
					sendMsgWithChannel(channel, "Hey! You're not allowed to run this command!");
					console.log(message._sender.nickname + " isnt in " + JSON.stringify(moderators));
				} else if (isUndefined(args[0]) || isUndefined(args[1])) {
					sendMsgWithChannel(channel, "Not Enough Arguments!");
				} else {
					if (args[0].startsWith("u/"))
						args[0] = args[0].slice(2);
					var newTitle = stringFromList(messageText.split(" ").slice(2)).trim();
					setTitle(args[0].toLowerCase(), newTitle.trim());
					sendMsgWithChannel(channel, args[0] + "'s title has been succesfully set to: " + newTitle);
				}
				break;
			case "titleget":
			case "gettitle":
				if (isUndefined(args[0])) {
					sendMsgWithChannel(channel, "Not Enough Arguments! You need to specify who's title to get!");
				} else {
					if (args[0].startsWith("u/"))
						args[0] = args[0].slice(2);
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
								sendMsgWithChannel(channel, "Lyrics of: " + song.full_title + os.EOL + os.EOL + song.lyrics);
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
					var newDescription = stringFromList(messageText.split(" ").slice(1)).trim();
					setDescription(message._sender.nickname.toLowerCase(), newDescription.trim());
					sendMsgWithChannel(channel, "Your description has been succesfully set to: " + os.EOL + newDescription);
				}
				break;
			case "descriptionget":
			case "getdescription":
				if (isUndefined(args[0])) {
					sendMsgWithChannel(channel, "Not Enough Arguments! You need to specify who's description to get!");
				} else {
					if (args[0].startsWith("u/")) {
						args[0] = args[0].slice(2);
					}
					getDescription(args[0], (description, success) => {
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
				var nicknameToSetTo = message._sender.nickname;
				if (!isUndefined(args[1])) {
					nicknameToSetTo = args[1];
				}
				var gamemode = "ERROR";
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
			default:
				if (!isUndefined(miscCommands[command.toLowerCase()])) {
					var returning = miscCommands[command.toLowerCase()][Math.floor(Math.random() * miscCommands[command.toLowerCase()].length)];
					var allArgsList = messageText.split(" ").slice(1);
					var allArgsString = stringFromList(allArgsList);
					var allArgsFromOneString = stringFromList(allArgsList.slice(1));
					returning = returning.replace("%(SENDER)", message._sender.nickname);
					returning = returning.replace("%(ARG1)", args[0]);
					returning = returning.replace("%(ARG2)", args[1]);
					returning = returning.replace("%(ARG3)", args[2]);
					returning = returning.replace("%(ALLARGS)", allArgsString);
					returning = returning.replace("%(ALLARGSAFTER1)", allArgsFromOneString);
					returning = returning.replace("%(SENDER)", message._sender.nickname);
					sendMsgWithChannel(channel, returning)
				}
				break;
		}
	}
}

function userListContainsUser(userList, user) {
	for (var userToCheck of userList) {
		if (userToCheck.userId == user.userId) {
			return true;
		}
	}
}

function stringFromList(list) {
	var returning = "";
	for (var i = 0; i < list.length; i++) {
		returning += list[i] + " ";
	}
	return returning;
}

function isUndefined(thing) {
	return typeof(thing) == "undefined";
}

async function getDescription(nick, callback) {
	fs.readFile("descriptions.json", (err, data) => {
		var descriptions = JSON.parse(data);
		if (isUndefined(descriptions[nick])) {
			callback("This person doesn't have a description.", false)
			return;
		}
		callback(descriptions[nick], true)
	});
}

async function setDescription(nick, newDescription) {
	fs.readFile("descriptions.json", (err, data) => {
		var descriptions = JSON.parse(data);
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
		var currentTitles = JSON.parse(data);
		if (isUndefined(currentTitles[nick])) {
			callback("This person doesn't have a title.")
			return;
		}
		callback(currentTitles[nick].t)
	});
}

async function setTitle(nick, newTitle) {
	fs.readFile("titles.json", (err, data) => {
		var currentTitles = JSON.parse(data);
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
	channel.sendUserMessage(msg, (message, error) => {
		if (error) {
			console.warn(`An error occured while trying to send "${msg}" in the channel ${channel.name}`);
			console.warn(error);
		}
	});
}

function trivia(channelUrl, channel) {
	if (timeOfSendingOfLastTrivia[channelUrl] + 60000 < Date.now() || isUndefined(timeOfSendingOfLastTrivia[channelUrl])) {
		axios.get("http://opentdb.com/api.php?amount=1").then((requestJson) => {
			var result = requestJson.data.results[0];
			result.question = unescapeHTML(result.question);
			var newMessage = triviaMessage.replace("%(CATEGORY)", result.category);
			newMessage = newMessage.replace("%(DIFFICULTY)", result.difficulty);
			if (result.type == "boolean") {
				newMessage = newMessage.replace("%(QUESTION)", "Yes Or No: " + result.question);
				newMessage = newMessage.replace("%(ANSWERS)", "");
			} else {
				newMessage = newMessage.replace("%(QUESTION)", result.question);
				var answers = [];
				answers.push(result.correct_answer);
				for (var o of result.incorrect_answers) {
					answers.push(o);
				}
				for (let i = answers.length - 1; i > 0; i--) {
					let j = Math.floor(Math.random() * (i + 1));
					[answers[i], answers[j]] = [answers[j], answers[i]];
				}
				var answersString = "";
				for (var i = 0; i < answers.length; i++) {
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
				console.log(newMessage);
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
	if (timeOfSendingOfLastTrivia[channelUrl] + 30000 < Date.now()) {
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
		console.log("THE ANSWER IS: " + currentAnswer);
	} else {
		channel.sendUserMessage("Not yet! Please wait another " + (30 + Math.round((timeOfSendingOfLastTrivia[channelUrl] - Date.now()) / 1000)).toString() + " seconds.", (message, error) => {
			if (error) {
				console.error(error);
			}
		});
	}
}

function unescapeHTML(str) {
	var htmlEntities = {
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
		var match;

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

function makerandomthing(length) {
	var result = '';
	var characters = '~-+=';
	var charactersLength = characters.length;
	for (var i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
}
ch.onUserReceivedInvitation = (channel, inviter, invitees) => {
	if (invitees.map(invitee => invitee.nickname).includes(client.nickname)) {
		console.log("I've been invited to a channel! :D");
		channel.acceptInvitation();
		console.log(`I've accepted the invite to ${channel.name}!`);
		sendMsgWithChannel(channel, helpMessage);
	}
};
sb.addChannelHandler("vsdfh64mc93mg0cn367vne4m50bn3b238", ch);
var messageInterval = setInterval(function() {
	newsMessage(1);
}, 1000 * 60 * 60 * 24)