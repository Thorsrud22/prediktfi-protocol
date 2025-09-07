// app/lib/ai/data-sources/tech-data.ts
export interface TechData {
  company: string;
  category: string;
  marketCap: number;
  revenue: number;
  revenueGrowth: number;
  employees: number;
  founded: number;
  lastUpdated: string;
}

export interface TechNews {
  title: string;
  summary: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  source: string;
  publishedAt: string;
  url: string;
}

export interface GitHubData {
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  lastCommit: string;
  contributors: number;
  languages: { [key: string]: number };
}

export interface TechTrends {
  ai: number;
  cloud: number;
  mobile: number;
  blockchain: number;
  iot: number;
  lastUpdated: string;
}

export class TechDataProvider {
  private static readonly NEWS_API = 'https://newsapi.org/v2/everything';
  private static readonly GITHUB_API = 'https://api.github.com/repos';

  static async getTechData(company: string): Promise<TechData> {
    try {
      // Get company data from various sources
      const companyData = await this.fetchCompanyData(company);
      
      return {
        company: company,
        category: companyData.category || 'Technology',
        marketCap: companyData.marketCap || 0,
        revenue: companyData.revenue || 0,
        revenueGrowth: companyData.revenueGrowth || 0,
        employees: companyData.employees || 0,
        founded: companyData.founded || 0,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching tech data:', error);
      return this.getDefaultTechData(company);
    }
  }

  static async getTechNews(company: string, limit: number = 10): Promise<TechNews[]> {
    try {
      const query = `${company} technology OR ${company} tech OR ${company} startup`;
      const response = await fetch(
        `${this.NEWS_API}?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=${limit}&apiKey=${process.env.NEWS_API_KEY || 'demo'}`
      );
      
      if (!response.ok) {
        throw new Error('News API request failed');
      }
      
      const data = await response.json();
      
      return data.articles?.map((article: any) => ({
        title: article.title,
        summary: article.description,
        sentiment: this.analyzeSentiment(article.title + ' ' + article.description),
        source: article.source.name,
        publishedAt: article.publishedAt,
        url: article.url
      })) || [];
    } catch (error) {
      console.error('Error fetching tech news:', error);
      return this.getDefaultTechNews();
    }
  }

  static async getGitHubData(repo: string): Promise<GitHubData> {
    try {
      const response = await fetch(`${this.GITHUB_API}/${repo}`);
      
      if (!response.ok) {
        throw new Error('GitHub API request failed');
      }
      
      const data = await response.json();
      
      // Get language data
      const languagesResponse = await fetch(`${this.GITHUB_API}/${repo}/languages`);
      const languages = languagesResponse.ok ? await languagesResponse.json() : {};
      
      return {
        stars: data.stargazers_count || 0,
        forks: data.forks_count || 0,
        watchers: data.watchers_count || 0,
        openIssues: data.open_issues_count || 0,
        lastCommit: data.updated_at || '',
        contributors: 0, // Would need additional API call
        languages: languages
      };
    } catch (error) {
      console.error('Error fetching GitHub data:', error);
      return this.getDefaultGitHubData();
    }
  }

  static async getTechTrends(): Promise<TechTrends> {
    try {
      // Simulate trend data based on news analysis
      const trends = await this.analyzeTechTrends();
      
      return {
        ai: trends.ai || 0,
        cloud: trends.cloud || 0,
        mobile: trends.mobile || 0,
        blockchain: trends.blockchain || 0,
        iot: trends.iot || 0,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching tech trends:', error);
      return this.getDefaultTechTrends();
    }
  }

  private static async fetchCompanyData(company: string): Promise<any> {
    // This would integrate with various APIs like Crunchbase, Yahoo Finance, etc.
    // For now, return mock data based on company name
    const companyData: { [key: string]: any } = {
      'openai': {
        category: 'AI',
        marketCap: 100000000000, // $100B
        revenue: 2000000000, // $2B
        revenueGrowth: 150,
        employees: 1500,
        founded: 2015
      },
      'microsoft': {
        category: 'Software',
        marketCap: 3000000000000, // $3T
        revenue: 200000000000, // $200B
        revenueGrowth: 15,
        employees: 220000,
        founded: 1975
      },
      'google': {
        category: 'Internet',
        marketCap: 2000000000000, // $2T
        revenue: 280000000000, // $280B
        revenueGrowth: 10,
        employees: 190000,
        founded: 1998
      },
      'apple': {
        category: 'Hardware',
        marketCap: 3500000000000, // $3.5T
        revenue: 400000000000, // $400B
        revenueGrowth: 8,
        employees: 160000,
        founded: 1976
      },
      'meta': {
        category: 'Social Media',
        marketCap: 800000000000, // $800B
        revenue: 120000000000, // $120B
        revenueGrowth: 5,
        employees: 87000,
        founded: 2004
      }
    };
    
    return companyData[company.toLowerCase()] || {
      category: 'Technology',
      marketCap: 0,
      revenue: 0,
      revenueGrowth: 0,
      employees: 0,
      founded: 0
    };
  }

  private static async analyzeTechTrends(): Promise<any> {
    // Simulate trend analysis based on news sentiment
    const trends = {
      ai: 85, // High AI trend
      cloud: 75, // High cloud trend
      mobile: 60, // Medium mobile trend
      blockchain: 40, // Lower blockchain trend
      iot: 55 // Medium IoT trend
    };
    
    return trends;
  }

  private static analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['breakthrough', 'innovation', 'growth', 'success', 'launch', 'adoption', 'expansion', 'partnership'];
    const negativeWords = ['decline', 'failure', 'layoffs', 'competition', 'challenges', 'risks', 'concerns', 'slowdown'];
    
    const textLower = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => textLower.includes(word)).length;
    const negativeCount = negativeWords.filter(word => textLower.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private static getDefaultTechData(company: string): TechData {
    return {
      company: company,
      category: 'Technology',
      marketCap: 0,
      revenue: 0,
      revenueGrowth: 0,
      employees: 0,
      founded: 0,
      lastUpdated: new Date().toISOString()
    };
  }

  private static getDefaultTechNews(): TechNews[] {
    return [
      {
        title: 'Tech Industry Update',
        summary: 'General technology industry trends and developments',
        sentiment: 'neutral',
        source: 'TechCrunch',
        publishedAt: new Date().toISOString(),
        url: '#'
      }
    ];
  }

  private static getDefaultGitHubData(): GitHubData {
    return {
      stars: 0,
      forks: 0,
      watchers: 0,
      openIssues: 0,
      lastCommit: '',
      contributors: 0,
      languages: {}
    };
  }

  private static getDefaultTechTrends(): TechTrends {
    return {
      ai: 50,
      cloud: 50,
      mobile: 50,
      blockchain: 50,
      iot: 50,
      lastUpdated: new Date().toISOString()
    };
  }
}
