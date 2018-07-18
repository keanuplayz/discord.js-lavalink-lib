/*
	This is the Lavalink version of nexu-dev and DarkoPendragon's discord.js-musicbot-addon!
	Get Lavalink here: https://ci.fredboat.com/viewLog.html?buildId=lastSuccessful&buildTypeId=Lavalink_Build&tab=artifacts&guest=1
	
	Lavalink has also been included in this module's folder along with its settings.
	
	You require to manually run it due to me not being sure if this laptop can necessarily handle Lavalink.
	Damn ASUS EeePCs and Intel Atoms...
	
	You also don't require to add the Lavalink config into the options due to it already being included
	in the module, unless you changed its settings.
	
	This module, like a lot of my code, has loads of notes to help you out!
	
	My GitHub: https://github.com/BluSpring
	Support: https://discord.gg/xgBaPPE
*/

const Discord = require('discord.js');
const {
  YTSearcher
} = require('ytsearcher');
const PACKAGE = require('./package.json');
const Lavalink = require('discord.js-lavalink');
const { PlayerManager } = Lavalink;
const snekfetch = require('snekfetch');

const defaultRegions = {
    asia: ["sydney", "singapore", "japan", "hongkong"],
    eu: ["london", "frankfurt", "amsterdam", "russia", "eu-central", "eu-west"],
    us: ["us-central", "us-west", "us-east", "us-south", "brazil"]
};

module.exports = function (clientOriginal, options) {
	class LavalinkMusic { // Construct everything?
		constructor(clientOriginal, options) {
			this.youtubeKey = (options && options.youtubeKey);
			this.prefix = (options && options.prefix) || '!';
			this.queues = {};
			this.loops = {};
			this.admins = (options && options.admins) || [];
			this.lavalink = (options && options.lavalink) || {
				restnode: {
					host: "localhost",
					port: 2333,
					password: "b1nzyR8l1m1t5"
				},
				nodes: [
					{ host: "localhost", port: 80, region: "asia", password: "b1nzyR8l1m1t5" }
				],
			};
			this.token = (options && options.token);
		}
		
	}
	
	var music = new LavalinkMusic(clientOriginal, options);
	var musicbot = music;
	
	class MusicClient extends Discord.Client { // Music client setup, sidenote this isn't my code once again.

		constructor(options) {
			super(options);

			this.player = null;

			this.once("ready", this._ready.bind(this));
		}

		_ready() {
			this.player = new PlayerManager(this, music.lavalink.nodes, {
				user: this.user.id,
				shards: music.getShard()
			});
		}

	}
	
	var client = new MusicClient();
	client.login(music.token); // Relogin the bot just for the Lavalink thing.
	
	async function startBot() { // Start the damn bot.
		if (process.version.slice(1)
	    .split('.')[0] < 8) {
			console.log(new Error(`[LavalinkMusicBot] Node v8 or higher is required, please update!`));
			process.exit(1);
		}
		
		if(Discord.version.slice(1).split('.')[0] > 12) {
			console.log(new Error(`[LavalinkMusicBot] Discord.JS version 12 and above is currently unsupported! Please use an older version!`));
			process.exit(1);
		}
	
		if (typeof music.admins !== 'object') {
			console.log(new TypeError(`"admins" must be an object (array)`));
			process.exit(1);
		}
		
		if(typeof music.prefix !== 'string') {
			console.log(new TypeError(`"prefix" must be a string`));
			process.exit(1);
		}
		
		if(!music.youtubeKey) {
			console.log(new TypeError(`This may be a discord.js-lavalink musicbot addon, but searches require the youtubeKey.`));
			process.exit(1);
		}
		
		if(music.youtubeKey && typeof music.youtubeKey !== 'string') {
			console.log(new TypeError(`"youtubeKey" must be a string`));
			process.exit(1);
		}
		
		if(typeof music.lavalink !== 'object') {
			console.log(new TypeError(`"lavalink" options must be an object!`));
			process.exit(1);
		}
		
		if(!music.lavalink.restnode || !music.lavalink.nodes[0]) {
			console.log(new TypeError(`You seem to be missing restnode or a node.`));
			process.exit(1);
		}
	}
	startBot();
	
	const searcher = new YTSearcher({
		key: music.youtubeKey,
		revealkey: true
	});
	
	var bot = client;
	
	client.on('message', async message => { // Triggered on a message.
		const msg = message.content.trim();
		const command = msg.substring(music.prefix.length).split(/[ \n]/)[0].toLowerCase().trim();
		const suffix = msg.substring(music.prefix.length + command.length).trim();
		
		if(msg.toLowerCase().startsWith(music.prefix.toLowerCase())) {
			switch(command) { // I'm copy pasting code. I don't actually understand how this works.
				case 'mhelp':
					return music.help(message, suffix);
				case 'play':
					return music.play(message, suffix);
				case 'skip':
					return music.skip(message, suffix);
				case 'queue':
					return music.queue(message, suffix);
				case 'stop':
					return music.stop(message, suffix);
				case 'np':
					return music.np(message, suffix);
			}
		}
	})
	.on('ready', async () => { // Once the bot is ready, this starts.
		console.log(`[LavalinkMusic] Running version ${PACKAGE.version}`);
		console.log(`[LavalinkMusic] Running NodeJS ${process.version}`);
		console.log(`[LavalinkMusic] Running Discord.JS ${Discord.version}`);
		console.log(`[LavalinkMusic] Logged in as ${bot.user.tag} (ID ${bot.user.id})`);
		console.log(`[LavalinkMusic] Listening to host ${music.lavalink.restnode.host} and port ${music.lavalink.restnode.port}`);
		console.log(`[LavalinkMusic] Prefix: ${music.prefix}`);
	})
	
	music.help = (message, suffix) => {
		// Yes. I use RichEmbed(). This is why Discord.JS v12 isn't supported.
		const embed = new Discord.RichEmbed()
		.setColor("RANDOM")
		.setTitle(`${bot.user.tag} music help`)
		.setDescription(`"${music.prefix}mhelp" - Displays this message!
"${music.prefix}play" - Adds a song to the queue and plays it!
"${music.prefix}skip" - Skip a song!
"${music.prefix}queue" - Displays the queue!
"${music.prefix}stop" - Clears queue and stops the queue.
		`)
		.setAuthor(`${message.author.tag}`, message.author.avatarURL)
		.setFooter(`Module: discord.js-lavalink-musicbot`)
		message.channel.send(embed);
	}
	
	music.getQueue = (server) => { // Get da queue!
		if(!music.queues[server]) music.queues[server] = [];
		return music.queues[server];
	}
	
	music.play = async (message, suffix) => { // Not willing to add notes here. Lazy.
		const args = message.content.split(' ').slice(music.prefix.split(' ').length);
		if(!args[0]) return message.channel.send('No arguments defined!')

        const player = await bot.player.join({
            guild: message.guild.id,
            channel: message.member.voiceChannelID,
            host: music.getIdealHost(bot, message.guild.region)
        }, { selfdeaf: true });
        if (!player) return message.channel.send("You need to be in a voice channel!")

		if(['https://', 'http://'].some(crx => args.join(' ').includes(crx))) {
			const queue = music.getQueue(message.guild.id);
			const [song] = await music.getSong(args.join(' '))
			queue.push(song);

			const embed = new Discord.RichEmbed()
			.setColor([255, 69, 0])
			.setAuthor(`Play Command`, bot.user.avatarURL)
			.setTitle('Added to queue!')
			.setDescription(`• **Title**: ${song.info.title}
• **Author**: ${song.info.author}
• **URL**: [${song.info.uri}](${song.info.uri})
• **Length**: ${music.getYTLength(song.info.length)}
        `).setFooter(`Module: discord.js-lavalink-musicbot`)
			message.channel.send(embed)
			if(queue.length === 1) music.execQueue(bot, message, queue, player);
		} else {
			searcher.search(args.join(" "), { type: 'video' }).then(async searchResult => {
				if (!searchResult.totalResults || searchResult.totalResults === 0) return message.channel.send('Failed to get search results.');
				const result = searchResult.first
				const queue = music.getQueue(message.guild.id);
				const [song] = await music.getSong(result.url);   

				queue.push(song);
				const embed = new Discord.RichEmbed()
				.setColor([255, 69, 0])
				.setAuthor(`Play Command`, bot.user.avatarURL)
				.setTitle('Added to queue!')
				.setDescription(`• **Title**: ${song.info.title}
• **Author**: ${song.info.author}
• **URL**: [${song.info.uri}](${song.info.uri})
• **Length**: ${music.getYTLength(song.info.length)}
				`).setFooter(`Module: discord.js-lavalink-musicbot`)
				message.channel.send(embed)
				if(queue.length === 1) music.execQueue(message, queue, player);
			})
		}
	}
	
	music.getRegion = (bot, region) => {// This is not my code.
		region = region.replace("vip-", "");
		for (const key in defaultRegions) {
			const nodes = bot.player.nodes.filter(node => node.connected && node.region === key);
			if (!nodes) continue;
			for (const id of defaultRegions[key]) {
				if (id === region || region.startsWith(id) || region.includes(id)) return key;
			}
		}
		return "asia";
	}
	
	music.getIdealHost = (bot, region) => {// This is not my code.
		region = music.getRegion(bot, region);
		const foundNode = bot.player.nodes.find(node => node.ready && node.region === region);
		if (foundNode) return foundNode.host;
		return bot.player.nodes.first().host;
	}
	
	music.getSong = async (string) => {
		// This is not my code.
		const res = await snekfetch.get(`http://${music.lavalink.restnode.host}:${music.lavalink.restnode.port}/loadtracks`)
			.query({ identifier: string })
			.set("Authorization", music.lavalink.restnode.password)
			.catch(err => {
				console.error(err);
				return null;
			});
		if (!res) return "User doesn't exist!";

		return res.body;
	}
	
	music.execQueue = (message, queue, player) => {
		player.play(queue[0].track); // Plays the first item in the queue.
		const embed = new Discord.RichEmbed()
				.setColor([255, 69, 0])
				.setAuthor(`Music`, bot.user.avatarURL)
				.setTitle('Now playing new song!')
				.setDescription(`• **Title**: ${queue[0].info.title}
• **Author**: ${queue[0].info.author}
• **URL**: [${queue[0].info.uri}](${queue[0].info.uri})
• **Length**: ${music.getYTLength(queue[0].info.length)}
				`).setFooter(`Module: discord.js-lavalink-musicbot`)
		message.channel.send(embed)

		player.once("end", async data => {
			if(queue.length > 1) { // So, if there's more than one item in the queue, play the new item.
				setTimeout(() => {
					queue.shift(); // Switch songs.
					music.execQueue(bot, message, queue, player);
				}, 1000) // Wait a second.	
			} else { // If not, just stop the queue and leave.
				queue.shift(); 
				message.channel.send(`Queue is now empty! Leaving voice channel...`)
				await bot.player.leave(message.guild.id);
			}
		});
	}
	
	music.getYTLength = (millisec) => {
    // Credit: https://stackoverflow.com/questions/19700283/how-to-convert-time-milliseconds-to-hours-min-sec-format-in-javascript
		var seconds = (millisec / 1000).toFixed(0);
		var minutes = Math.floor(seconds / 60);
		var hours = "";
		if (minutes > 59) {
			hours = Math.floor(minutes / 60);
			hours = (hours >= 10) ? hours : "0" + hours;
			minutes = minutes - (hours * 60);
			minutes = (minutes >= 10) ? minutes : "0" + minutes;
		}
		// Normally I'd give notes here, but I actually don't understand how this code works.
		seconds = Math.floor(seconds % 60);
		seconds = (seconds >= 10) ? seconds : "0" + seconds;
		if (hours != "") {
			return hours + ":" + minutes + ":" + seconds;
		}
		return minutes + ":" + seconds;
	}
	
	music.getShard = () => {
		let shardin = Math.floor(clientOriginal.guilds.size / 2500);
		if(!shardin || shardin == null || shardin == 0)
			shardin = 1;
		
		return shardin;
	}
	
	music.np = async (message, suffix) => {
		try {
			if(!bot.player) // This actually isn't how you do it. I don't know the proper way, don't judge me.
				return message.channel.send("Currently not playing anything.")
			
			const embed = new Discord.RichEmbed()
			.setColor('RANDOM')
			.setTitle(`Hold on, unfinished.`)
			message.channel.send(embed);
		} catch (err) {
			message.channel.send(`Error executing this command! \`\`\`xl\n${err.stack}\n\`\`\``)
		}
	}
}