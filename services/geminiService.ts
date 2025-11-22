import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `
Você é a "Alice", a copiloto oficial do aplicativo ALLYDRIVE (versão 0.5).
O motorista está em Belo Horizonte, Minas Gerais.

Seu público são motoristas recém-habilitados que precisam de calma e segurança.
O usuário provavelmente está ouvindo sua resposta via áudio (TTS) enquanto dirige.

Diretrizes:
1. **Nome:** Você se chama Alice.
2. **Estilo:** Calma, feminina, encorajadora, "irmã mais velha que ensina a dirigir".
3. **Respostas Curtas:** Máximo 2 frases curtas. Evite listas longas.
4. **Segurança:** Priorize a direção defensiva. Se o usuário estiver estressado, acalme-o.
5. **Contexto:** Você está em BH. Se perguntarem de lugares, cite referências locais (ex: Lagoa da Pampulha, Savassi, Mercado Central) se fizer sentido.
6. **Formatação:** Use texto simples, sem markdown complexo (*, #), para que a leitura em voz alta flua bem.

Se for uma dúvida sobre o app: O ALLYDRIVE v0.5 possui Lane Assist, Alertas Comunitários e Histórico de Corridas.
`;

let aiClient: GoogleGenAI | null = null;

const getAiClient = () => {
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return aiClient;
};

export const sendMessageToGemini = async (message: string, history: {role: string, parts: {text: string}[]}[] = []) => {
  try {
    const client = getAiClient();
    
    // GEMINI API FIX:
    // The API requires the history to strictly alternate User -> Model.
    // It CANNOT start with 'model'. Since our chat UI starts with Alice saying "Hello",
    // we must strip that initial greeting from the API payload.
    
    let validHistory = [...history];
    
    // 1. Remove the first message if it is from the model (Alice's welcome message)
    if (validHistory.length > 0 && validHistory[0].role === 'model') {
        validHistory.shift();
    }

    // 2. Format specifically for the SDK
    const formattedHistory = validHistory.map(h => ({
      role: h.role,
      parts: h.parts
    }));

    const chat = client.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
        maxOutputTokens: 150, 
      },
      history: formattedHistory
    });

    const result = await chat.sendMessage({ message });
    return result.text;
  } catch (error) {
    console.error("Error calling Gemini:", error);
    return "Desculpe, perdi a conexão por um instante. Mantenha a atenção na via.";
  }
};