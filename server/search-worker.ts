/**
 * AI-Powered Natural Language Contract Search Worker
 * Queries across all analyzed contracts using Google GenAI SDK
 */
import { GoogleGenAI, Type } from '@google/genai';
import { db } from './db';
import { RiskLevel, SearchResultResponse, SearchMatch } from '../src/types';

export const contractSearchSchema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description:
        'A comprehensive natural-language answer explaining which contracts are relevant to the query and why, citing specific contract names and clause terms. If none match, clearly explain why no contracts in the repository match.',
    },
    has_matches: {
      type: Type.BOOLEAN,
      description:
        'True if one or more contracts contain clauses or terms relevant to the user query; false if no contracts match.',
    },
    matches: {
      type: Type.ARRAY,
      description: 'List of relevant matching contracts from the provided dataset.',
      items: {
        type: Type.OBJECT,
        properties: {
          contract_id: {
            type: Type.STRING,
            description: 'The exact contract ID from the provided dataset',
          },
          contract_title: {
            type: Type.STRING,
            description: 'The title of the contract',
          },
          relevance_reason: {
            type: Type.STRING,
            description: 'Clear concise explanation of why this contract is relevant to the query',
          },
          matching_clauses: {
            type: Type.ARRAY,
            description: 'Clauses in this contract that specifically answer or relate to the query',
            items: {
              type: Type.OBJECT,
              properties: {
                clause_title: { type: Type.STRING },
                clause_type: { type: Type.STRING },
                clause_text: { type: Type.STRING, description: 'Excerpt or exact text of the clause' },
                risk_level: { type: Type.STRING },
                page_number: { type: Type.INTEGER, nullable: true },
                explanation: { type: Type.STRING, nullable: true, description: 'How this clause relates to the user question' },
              },
              required: ['clause_title', 'clause_type', 'clause_text', 'risk_level'],
            },
          },
        },
        required: ['contract_id', 'contract_title', 'relevance_reason', 'matching_clauses'],
      },
    },
  },
  required: ['summary', 'has_matches', 'matches'],
};

export async function searchContractsWithAi(query: string, userId: string): Promise<SearchResultResponse> {
  const trimmedQuery = (query || '').trim();
  const allContracts = db.getAllContracts(userId);
  const completedContracts = allContracts.filter(
    (c) => c.extraction_status === 'completed'
  );

  // If no contracts have been analyzed yet
  if (completedContracts.length === 0) {
    return {
      query: trimmedQuery,
      hasAnalyzedContracts: false,
      has_matches: false,
      summary:
        'No analyzed contracts are currently available in the repository. Please upload a contract PDF or load sample agreements to search across terms, liability caps, and clauses.',
      matches: [],
    };
  }

  // If query is empty
  if (!trimmedQuery) {
    return {
      query: '',
      hasAnalyzedContracts: true,
      has_matches: false,
      summary: 'Please enter a question or query to search across all analyzed contracts.',
      matches: [],
    };
  }

  // Build structured context of all analyzed contracts and their clauses
  const contractsContext = completedContracts.map((c) => {
    const clauses = db.getClausesByContractId(c.id);
    return {
      contract_id: c.id,
      filename: c.filename,
      contract_title: c.contract_title || c.filename,
      contract_type: c.contract_type || 'General Contract',
      effective_date: c.effective_date,
      parties: c.parties,
      overall_risk_level: c.overall_risk_level,
      overall_risk_score: c.overall_risk_score,
      executive_summary: c.executive_summary,
      clauses: clauses.map((cl) => ({
        clause_title: cl.clause_title,
        clause_type: cl.clause_type,
        clause_text: cl.clause_text,
        risk_level: cl.risk_level,
        risk_reason: cl.risk_reason,
        recommendation: cl.recommendation,
        page_number: cl.page_number,
      })),
    };
  });

  const apiKey = process.env.GEMINI_API_KEY;
  let aiResult: any = null;

  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim().length > 5) {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const prompt = `You are an expert contract attorney and legal intelligence search engine.
The user is querying a portfolio of analyzed commercial contracts with the following natural language question:
"${trimmedQuery}"

Carefully evaluate the user query against the provided analyzed contracts and their extracted clauses.
CRITICAL INSTRUCTIONS:
1. Base your answer ONLY on the provided contract data and clauses. Do NOT fabricate or assume terms not in the text.
2. If one or more contracts contain terms, clauses, or provisions that answer the query (e.g. auto-renewal, liability caps under a certain amount, indemnity, termination fees, payment terms, data rights):
   - Provide a clear, natural-language executive summary answering the question directly, explicitly naming the relevant contract(s) and key terms.
   - Set has_matches to true.
   - Include each relevant contract in the matches array with the exact contract_id, title, relevance_reason, and the matching clauses with verbatim excerpts and brief explanation.
3. If NO contracts match or relate to the query:
   - Provide a polite, helpful summary explaining that none of the analyzed contracts in the repository match the query criteria (specifying what was searched).
   - Set has_matches to false.
   - Return an empty matches array.

ANALYZED CONTRACTS REPOSITORY DATA:
${JSON.stringify(contractsContext, null, 2)}
`;

    try {
      const genPromise = ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: contractSearchSchema,
          temperature: 0.1,
        },
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Search generation timeout (7s)')), 7000)
      );

      const response: any = await Promise.race([genPromise, timeoutPromise]);
      const textOutput = response.text;
      if (textOutput) {
        aiResult = JSON.parse(textOutput.trim());
      }
    } catch (err: any) {
      console.warn('Gemini Search API call error, falling back to semantic domain matcher:', err?.message || err);
    }
  }

  // Fallback to deterministic legal search matcher if Gemini is unavailable or fails
  if (!aiResult) {
    aiResult = executeDeterministicLegalSearch(trimmedQuery, contractsContext);
  }

  // Enrich matching contracts with database metadata
  const enrichedMatches: SearchMatch[] = (aiResult.matches || []).map((m: any) => {
    const dbContract = db.getContractById(m.contract_id, userId);
    return {
      contract_id: m.contract_id,
      contract_title: m.contract_title || dbContract?.contract_title || dbContract?.filename || 'Contract Agreement',
      contract_type: dbContract?.contract_type || null,
      overall_risk_level: dbContract?.overall_risk_level || null,
      overall_risk_score: dbContract?.overall_risk_score || null,
      relevance_reason: m.relevance_reason || 'Matched query terms',
      matching_clauses: (m.matching_clauses || []).map((cl: any) => ({
        clause_title: cl.clause_title || 'Relevant Clause',
        clause_type: cl.clause_type || 'General Term',
        clause_text: cl.clause_text || '',
        risk_level: (cl.risk_level || 'medium') as RiskLevel,
        page_number: typeof cl.page_number === 'number' ? cl.page_number : null,
        explanation: cl.explanation || undefined,
      })),
    };
  });

  return {
    query: trimmedQuery,
    hasAnalyzedContracts: true,
    has_matches: Boolean(aiResult.has_matches && enrichedMatches.length > 0),
    summary: aiResult.summary || (enrichedMatches.length > 0 ? `Found ${enrichedMatches.length} matching contract(s).` : 'No matching contracts found for your query.'),
    matches: enrichedMatches,
  };
}

/**
 * Intelligent deterministic legal query matcher (fallback)
 */
function executeDeterministicLegalSearch(query: string, contracts: any[]): { summary: string; has_matches: boolean; matches: any[] } {
  const q = query.toLowerCase();
  const matches: any[] = [];

  for (const contract of contracts) {
    const matchingClauses: any[] = [];
    let matchedReason = '';

    // Check query topics
    const isAutoRenewal = q.includes('renew') || q.includes('auto-renew') || q.includes('renewal') || q.includes('evergreen');
    const isLiability = q.includes('liab') || q.includes('cap') || q.includes('50,000') || q.includes('5000') || q.includes('5,000') || q.includes('uncapped') || q.includes('limit');
    const isTermination = q.includes('terminat') || q.includes('penalty') || q.includes('convenience') || q.includes('cancel');
    const isIndemnity = q.includes('indemn') || q.includes('hold harmless') || q.includes('defense') || q.includes('infring');
    const isPayment = q.includes('pay') || q.includes('fee') || q.includes('bill') || q.includes('quarter') || q.includes('30 day') || q.includes('net');
    const isConfidentiality = q.includes('confident') || q.includes('nda') || q.includes('secret') || q.includes('surviv') || q.includes('7 year');
    const isAi = q.includes('ai') || q.includes('machine learning') || q.includes('model') || q.includes('train') || q.includes('data');
    const isData = q.includes('privacy') || q.includes('breach') || q.includes('security') || q.includes('notification') || q.includes('gdpr');

    for (const clause of contract.clauses) {
      const cText = (clause.clause_text + ' ' + clause.clause_title + ' ' + clause.clause_type + ' ' + (clause.risk_reason || '')).toLowerCase();
      let isClauseMatch = false;
      let exp = '';

      if (isAutoRenewal && (cText.includes('renew') || cText.includes('consecutive') || cText.includes('12-month'))) {
        isClauseMatch = true;
        exp = 'Specifies automatic annual renewal terms and required notice window.';
        if (!matchedReason) matchedReason = 'Contains automatic renewal provision and annual price escalation terms.';
      } else if (isLiability && (cText.includes('liab') || cText.includes('cap') || cText.includes('$5,000') || cText.includes('uncapped') || cText.includes('damages'))) {
        isClauseMatch = true;
        exp = 'Defines limitation of liability cap and damages restrictions.';
        if (!matchedReason) matchedReason = 'Contains explicit limitation of liability provisions and liability caps.';
      } else if (isTermination && (cText.includes('terminat') || cText.includes('convenience') || cText.includes('100% of the remaining'))) {
        isClauseMatch = true;
        exp = 'Contains termination terms and early cancellation penalty structure.';
        if (!matchedReason) matchedReason = 'Contains termination obligations and early termination liquidated damages.';
      } else if (isIndemnity && (cText.includes('indemn') || cText.includes('harmless') || cText.includes('infringement') || cText.includes('defense'))) {
        isClauseMatch = true;
        exp = 'Defines third-party indemnification obligations and legal defense caps.';
        if (!matchedReason) matchedReason = 'Contains indemnification obligations and defense requirements.';
      } else if (isPayment && (cText.includes('pay') || cText.includes('billed') || cText.includes('$45,000') || cText.includes('interest') || cText.includes('fee'))) {
        isClauseMatch = true;
        exp = 'Defines payment schedule, billing frequency, and late payment interest.';
        if (!matchedReason) matchedReason = 'Specifies fee schedule, billing terms, and late payment conditions.';
      } else if (isConfidentiality && (cText.includes('confident') || cText.includes('care') || cText.includes('seven (7) years') || cText.includes('injunctive'))) {
        isClauseMatch = true;
        exp = 'Details confidentiality obligations and survival duration.';
        if (!matchedReason) matchedReason = 'Contains non-disclosure and confidentiality terms.';
      } else if (isAi && (cText.includes('ai') || cText.includes('machine learning') || cText.includes('train') || cText.includes('anonymize'))) {
        isClauseMatch = true;
        exp = 'Specifies rights to train machine learning models on customer data.';
        if (!matchedReason) matchedReason = 'Contains provisions regarding AI model training on customer data.';
      } else if (isData && (cText.includes('breach') || cText.includes('incident') || cText.includes('45') || cText.includes('security'))) {
        isClauseMatch = true;
        exp = 'Defines security incident and data breach notification timeframe.';
        if (!matchedReason) matchedReason = 'Outlines data privacy and security breach response obligations.';
      } else {
        // Generic keyword overlap
        const queryWords = q.split(/\s+/).filter(w => w.length > 3 && !['what', 'which', 'show', 'contracts', 'have', 'with', 'under', 'over', 'that', 'from'].includes(w));
        const hasKeyword = queryWords.some(w => cText.includes(w));
        if (hasKeyword && queryWords.length > 0) {
          isClauseMatch = true;
          exp = 'Contains matching legal terms relating to your query.';
          if (!matchedReason) matchedReason = `Contains clauses matching query keywords: "${queryWords.join(', ')}".`;
        }
      }

      if (isClauseMatch) {
        matchingClauses.push({
          clause_title: clause.clause_title,
          clause_type: clause.clause_type,
          clause_text: clause.clause_text,
          risk_level: clause.risk_level,
          page_number: clause.page_number,
          explanation: exp,
        });
      }
    }

    if (matchingClauses.length > 0) {
      matches.push({
        contract_id: contract.contract_id,
        contract_title: contract.contract_title,
        relevance_reason: matchedReason || 'Contains clauses directly addressing the query.',
        matching_clauses: matchingClauses,
      });
    }
  }

  if (matches.length > 0) {
    const titles = matches.map(m => `"${m.contract_title}"`).join(', ');
    return {
      summary: `Found ${matches.length} contract(s) matching your query (${titles}). Review the relevant clause excerpts below for specific terms and risk evaluations.`,
      has_matches: true,
      matches,
    };
  }

  return {
    summary: `No matching contracts were found for "${query}". None of the ${contracts.length} analyzed contracts in the repository contain clauses matching these specific criteria.`,
    has_matches: false,
    matches: [],
  };
}
