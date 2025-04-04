export interface RawMovie {
  title: string;
  year: number;
  rating: number;
  description: string;
  duration: number;
  language: string;
  genres: string[];
}

export async function fetchMovieListFromDeepseek(prompt: string): Promise<RawMovie[]> {
  try {
    const response = await fetch('https://api.deepseek.com/v1/movie-recommendations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({ prompt }),
    });

    const text = await response.text();

    try {
      const json = JSON.parse(text);
      if (!Array.isArray(json)) {
        throw new Error('Deepseek response is not a valid array');
      }

      return json as RawMovie[];
    } catch (parseError) {
      console.error('❌ Failed to parse Deepseek response:', parseError);
      console.log('🔍 Response content:', text);
      throw new Error('Invalid JSON returned from Deepseek');
    }
  } catch (err) {
    console.error('❌ Deepseek fetch error:', err);
    throw new Error('Failed to fetch movie recommendations from Deepseek');
  }
}
