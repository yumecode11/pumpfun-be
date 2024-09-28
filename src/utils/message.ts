interface DiscordMessage {
  content: string;
  username?: string;
  avatar_url?: string;
  embeds?: Embed[];
}

interface Embed {
  title: string;
  description: string;
  color?: number;
}

export const sendDiscordMessage = (message: string) => {
  fetch(process.env.DISCORD_WEBHOOK as string, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      content: message
    }),
  })
    .then(response => {
      if (response.ok) {
        console.log('Message sent successfully');
      } else {
        console.error('Error sending message:', response.status, response.statusText);
      }
    })
    .catch(error => {
      console.error('Error:', error);
    });
}