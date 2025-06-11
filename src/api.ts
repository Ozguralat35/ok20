import { ApiResponse, ChatAttachment } from './types';

const API_URL = 'https://suxr2ydt.rpcl.host/api/v1/workspace/okulyapayzeka/chat';
const API_KEY = import.meta.env.VITE_API_KEY;

export class ChatApiError extends Error {
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'ChatApiError';
  }
}

export const sendChatMessage = async (
  message: string, 
  mode: 'query' | 'chat' = 'chat',
  sessionId: string = 'user-session-1',
  attachments?: ChatAttachment[],
  reset: boolean = false
): Promise<ApiResponse> => {
  try {
    // API anahtarı kontrolü
    if (!API_KEY || API_KEY === 'your-api-key-here') {
      throw new ChatApiError('API anahtarı tanımlanmamış. Lütfen .env dosyasında VITE_API_KEY değerini ayarlayın.');
    }

    const requestBody: any = {
      message,
      mode,
      sessionId,
      reset
    };

    // Only add attachments if they exist and have content
    if (attachments && attachments.length > 0) {
      requestBody.attachments = attachments;
    }

    console.log('API Request:', {
      url: API_URL,
      body: requestBody,
      hasApiKey: !!API_KEY
    });

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'accept': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    console.log('API Response Status:', response.status);

    if (!response.ok) {
      let errorMessage = `API yanıt hatası: ${response.status} ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        console.log('API Error Data:', errorData);
        
        if (response.status === 403) {
          if (errorData.error === 'No valid api key found.' || errorData.message === 'Invalid API Key') {
            errorMessage = 'Geçersiz API anahtarı. Lütfen .env dosyasında doğru API anahtarını ayarlayın.';
          } else {
            errorMessage = 'API erişimi reddedildi. API anahtarınızı kontrol edin.';
          }
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (parseError) {
        console.error('Error parsing API error response:', parseError);
      }

      throw new ChatApiError(errorMessage, { status: response.status });
    }

    const data = await response.json();
    console.log('API Response Data:', data);
    
    if (data.error && data.error !== 'null' && data.error !== null) {
      throw new ChatApiError(data.error, data);
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    
    if (error instanceof ChatApiError) {
      throw error;
    }
    
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ChatApiError('Ağ bağlantı hatası. İnternet bağlantınızı kontrol edin.', error);
    }
    
    throw new ChatApiError('Beklenmeyen bir hata oluştu: ' + (error instanceof Error ? error.message : String(error)), error);
  }
};