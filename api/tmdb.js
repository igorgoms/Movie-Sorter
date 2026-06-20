// api/tmdb.js

// Esta é uma Função Serverless da Vercel.
// Ela atua como um intermediário seguro entre o seu frontend e a API do TMDB.

export default async function handler(request, response) {
    // 1. Pega a chave da API das Variáveis de Ambiente da Vercel. É seguro!
    const apiKey = process.env.TMDB_API_KEY;
    
    if (!apiKey) {
        return response.status(500).json({ error: 'A chave da API do TMDB não está configurada no servidor.' });
    }

    // 2. Extrai o endpoint e outros parâmetros diretamente de request.query (Padrão Vercel/Express)
    // Ex: /api/tmdb?endpoint=/discover/movie&page=2&with_genres=28
    const queryParams = { ...request.query };
    const endpoint = queryParams.endpoint;
    
    // Remove o endpoint para não enviá-lo como parâmetro de query para a API do TMDB
    delete queryParams.endpoint; 

    if (!endpoint) {
        return response.status(400).json({ error: 'O endpoint da API é obrigatório.' });
    }

    // 3. Define os parâmetros padrão e mescla com os que vieram do frontend
    const allParams = new URLSearchParams({
        api_key: apiKey,
        language: 'pt-BR',
        include_adult: 'false',
        ...queryParams // Espalha os parâmetros restantes enviados pelo frontend (ex: page, with_genres)
    });

    // 4. Constrói a URL final e faz a chamada para a API do TMDB.
    // Garante que o endpoint comece com '/' corretamente se não tiver
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const tmdbUrl = `https://api.themoviedb.org/3${cleanEndpoint}?${allParams.toString()}`;

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