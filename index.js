require('dotenv').config();
const { Client, Intents } = require('discord.js');
const { spawn } = require('child_process');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const os = require('os');

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
  ],
});

const commands = [
  {
    name: 'lock',
    description: 'Lock the session',
  },
  {
    name: 'unlock',
    description: 'Unlock the session',
  },
  {
    name: 'logout',
    description: 'Log out',
  },
  {
    name: 'state',
    description: 'Get lock screen status',
  },
  {
    name: 'timedlock',
    description: 'Lock and unlock the session repeatedly for a specified duration',
    options: [
      {
        name: 'total_time',
        type: 4, // Correct type for integer
        description: 'Total time in minutes to keep the session locked and unlocked',
        required: true,
      },
      {
        name: 'interval',
        type: 4, // Correct type for integer
        description: 'Interval in minutes between each lock and unlock',
        required: true,
      },
    ],
  },
];

const rest = new REST({ version: '9' }).setToken(process.env.CLIENT_TOKEN);

(async () => {
  try {
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands },
    );
    console.log('Successfully registered application commands.');
  } catch (error) {
    console.error('Error refreshing application (/) commands:', error);
  }
})();

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const currentTime = new Date();
  const { commandName } = interaction;

  try {
    switch (commandName.toLowerCase()) {
      case 'lock':
        spawn('/usr/bin/python3', ['lock.py', 'lock']);
        await interaction.reply(`\`\`\`Session Locked at ${currentTime.getHours()}:${currentTime.getMinutes()}\`\`\``);
        break;

      case 'unlock':
        spawn('/usr/bin/python3', ['lock.py', 'unlock']);
        await interaction.reply(`\`\`\`Session Unlocked at ${currentTime.getHours()}:${currentTime.getMinutes()}\`\`\``);
        break;

      case 'logout':
        await interaction.reply(`\`\`\`Session logged out at ${currentTime.getHours()}:${currentTime.getMinutes()}\`\`\``);
        spawn('/usr/bin/pkill', ['-u', os.userInfo().username]);
        break;

      case 'state':
        const pyProcess = spawn('python3', ['lock.py', 'islocked']);
        let result = '';

        pyProcess.stdout.on('data', (data) => {
          result += data.toString();
        });

        pyProcess.on('close', (code) => {
          if (code === 0) {
            const isLocked = result.trim() === 'True';
            interaction.reply(`\`\`\`Session is ${isLocked ? 'locked' : 'unlocked'}\`\`\``);
          } else {
            console.error(`Error executing 'state' command. Exit code: ${code}`);
            interaction.reply('Error checking lock state.');
          }
        });
        break;

      case 'timedlock':
        const totalTime = interaction.options.getInteger('total_time');
	const interval = interaction.options.getInteger('interval');
	if (interval >= totalTime) {
          await interaction.reply('Error: Interval should be less than the total time.');
          return;
        }
        spawn('/usr/bin/python3', ['lock.py', 'timedlock', totalTime.toString(), interval.toString()]);
        await interaction.reply(`\`\`\`Session will lock and unlock for ${totalTime} minutes with ${interval} minute intervals starting at ${currentTime.getHours()}:${currentTime.getMinutes()}\`\`\``);
        break;

      default:
        console.error(`Unknown command: ${commandName}`);
        await interaction.reply('Unknown command.');
    }
  } catch (error) {
    console.error('Error processing command:', error);
    await interaction.reply('An error occurred while processing the command.');
  }
});

client.login(process.env.CLIENT_TOKEN);

