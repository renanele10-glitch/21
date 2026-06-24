import { useEffect, useState } from "react";
import { DiscordSDK } from "@discord/embedded-app-sdk";

const sdk = new DiscordSDK(import.meta.env.VITE_DISCORD_CLIENT_ID);

export function useDiscord() {
  const [user, setUser]       = useState(null);
  const [channelId, setChannelId] = useState(null);
  const [ready, setReady]     = useState(false);

  useEffect(() => {
    async function init() {
      // 1. Aguarda SDK estar pronto
      await sdk.ready();

      // 2. Autoriza e troca code por token via nosso backend
      const { code } = await sdk.commands.authorize({
        client_id: import.meta.env.VITE_DISCORD_CLIENT_ID,
        response_type: "code",
        state: "",
        prompt: "none",
        scope: ["identify"],
      });

      const resp = await fetch("/.proxy/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const { access_token } = await resp.json();

      // 3. Autentica no SDK
      const auth = await sdk.commands.authenticate({ access_token });

      setUser({
        id:       auth.user.id,
        username: auth.user.username,
        avatar:   auth.user.avatar,
      });

      setChannelId(sdk.channelId);
      setReady(true);
    }

    init().catch(console.error);
  }, []);

  return { sdk, user, channelId, ready };
}
