export class GoogleGenAI {
  constructor(_config: { apiKey: string }) {}

  models = {
    generateContent: async (_args: unknown) => {
      return {
        text: () => JSON.stringify({}),
      };
    },
  };
}
