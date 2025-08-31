// api/tmdb.js

// Esta é uma Função Serverless da Vercel.
// Ela atua como um intermediário seguro entre o seu frontend e a API do TMDB.

export default async function handler(request, response) {
    // 1. Pega a chave da API das Variáveis de Ambiente da Vercel. É seguro!
    const apiKey = process.env.TMDB_API_KEY;
    
    if (!apiKey) {
        return response.status(500).json({ error: 'A chave da API do TMDB não está configurada no servidor.' });
    }

    // 2. Extrai o endpoint e outros parâmetros da URL da requisição do frontend.
    // Ex: /api/tmdb?endpoint=/discover/movie&page=2&with_genres=28
    const { searchParams } = new URL(request.url, `http://${request.headers.host}`);
    const endpoint = searchParams.get('endpoint');
    searchParams.delete('endpoint'); // Remove para não enviar à API do TMDB

    if (!endpoint) {
        return response.status(400).json({ error: 'O endpoint da API é obrigatório.' });
    }

    // 3. Define os parâmetros padrão e adiciona os que vieram do frontend.
    const defaultParams = {
        api_key: apiKey,
        language: 'pt-BR',
        include_adult: 'false',
    };

    const allParams = new URLSearchParams(defaultParams);
    searchParams.forEach((value, key) => {
        allParams.append(key, value);
    });

    // 4. Constrói a URL final e faz a chamada para a API do TMDB.
    const tmdbUrl = `https://api.themoviedb.org/3${endpoint}?${allParams.toString()}`;

    try {
        const tmdbResponse = await fetch(tmdbUrl);
        const data = await tmdbResponse.json();

        if (!tmdbResponse.ok) {
            // Se o TMDB retornar um erro, envia esse erro para o frontend.
            return response.status(tmdbResponse.status).json(data);
        }
        
        // 5. Envia a resposta bem-sucedida do TMDB de volta para o frontend.
        // Adiciona um header de cache para otimizar.
        response.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate'); // Cache de 1 hora
        return response.status(200).json(data);

    } catch (error) {
        console.error('Erro ao chamar a API do TMDB:', error);
        return response.status(500).json({ error: 'Erro interno do servidor.' });
    }
}
